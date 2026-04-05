import type {
  GetEventsResponse,
  GetScoringResponse,
  GetSessionResponse
} from "@medstudy/contracts";
import { create } from "zustand";
import { createApiClient } from "../services/api-client";
import {
  CACHE_KEYS,
  getCacheFreshness,
  queueAction,
  readCacheEntry,
  writeCacheEntry
} from "../services/cache-service";
import { MOBILE_API_BASE_URL } from "../utils/constants";
import type { HomeSummary, SessionResultSummary } from "../types/app";
import { useAuthStore } from "./auth-store";

type SessionStore = {
  homeSummary: HomeSummary | null;
  currentSession: GetSessionResponse | null;
  scoring: GetScoringResponse["scoring"];
  events: GetEventsResponse["events"];
  results: readonly SessionResultSummary[];
  isLoading: boolean;
  error?: string;
  lastFetchedAt?: string;
  cacheState: "fresh" | "stale" | "expired" | "missing";
  fetchHome: () => Promise<HomeSummary | null>;
  fetchSession: (sessionId: string) => Promise<GetSessionResponse | null>;
  fetchResults: () => Promise<readonly SessionResultSummary[]>;
  completeCheckpoint: (
    sessionId: string,
    checkpointId: string,
    note?: string,
    isOnline?: boolean
  ) => Promise<void>;
  submitArtifact: (payload: {
    sessionId: string;
    artifact: Parameters<
      ReturnType<typeof createApiClient>["submitArtifactPayload"]
    >[0]["artifact"];
    isOnline?: boolean;
  }) => Promise<void>;
  invalidate: () => void;
};

function getClient() {
  return createApiClient({
    backendUrl: MOBILE_API_BASE_URL,
    getAuthSession: async () => useAuthStore.getState().session,
    onAuthSession: async (session) => {
      useAuthStore.getState().setSession(session);
    }
  });
}

function newQueueId() {
  return globalThis.crypto?.randomUUID?.() ?? `queue_${Date.now()}_${Math.random()}`;
}

export const useSessionStore = create<SessionStore>((set) => ({
  homeSummary: null,
  currentSession: null,
  scoring: null,
  events: [],
  results: [],
  isLoading: false,
  error: undefined,
  lastFetchedAt: undefined,
  cacheState: "missing",
  async fetchHome() {
    set({ isLoading: true, error: undefined });
    const client = getClient();
    try {
      const homeSummary = await client.getCurrentSessionSummary();
      await writeCacheEntry(CACHE_KEYS.currentSession, homeSummary);
      set({
        homeSummary,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
        cacheState: "fresh"
      });
      return homeSummary;
    } catch (error) {
      const cached = await readCacheEntry<HomeSummary>(CACHE_KEYS.currentSession);
      if (cached) {
        const cacheState = getCacheFreshness(cached.cachedAt);
        set({
          homeSummary: cacheState === "expired" ? null : cached.data,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch home.",
          cacheState
        });
        return cacheState === "expired" ? null : cached.data;
      }

      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch home.",
        cacheState: "missing"
      });
      return null;
    }
  },
  async fetchSession(sessionId) {
    set({ isLoading: true, error: undefined });
    const client = getClient();
    try {
      const [currentSession, scoring, events] = await Promise.all([
        client.getSession(sessionId),
        client.getScoring(sessionId),
        client.getEvents(sessionId)
      ]);
      await writeCacheEntry(CACHE_KEYS.currentSession, currentSession);
      set({
        currentSession,
        scoring: scoring.scoring,
        events: events.events,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
        cacheState: "fresh"
      });
      return currentSession;
    } catch (error) {
      const cached = await readCacheEntry<GetSessionResponse>(CACHE_KEYS.currentSession);
      if (cached) {
        const cacheState = getCacheFreshness(cached.cachedAt);
        set({
          currentSession: cacheState === "expired" ? null : cached.data,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch session.",
          cacheState
        });
        return cacheState === "expired" ? null : cached.data;
      }

      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch session."
      });
      return null;
    }
  },
  async fetchResults() {
    set({ isLoading: true, error: undefined });
    const client = getClient();
    try {
      const results = await client.getResults();
      await writeCacheEntry(CACHE_KEYS.results, results.results);
      set({
        results: results.results,
        isLoading: false,
        lastFetchedAt: new Date().toISOString()
      });
      return results.results;
    } catch (error) {
      const cached = await readCacheEntry<readonly SessionResultSummary[]>(CACHE_KEYS.results);
      set({
        results: cached?.data ?? [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch results."
      });
      return cached?.data ?? [];
    }
  },
  async completeCheckpoint(sessionId, checkpointId, note, isOnline = true) {
    const snapshot = useSessionStore.getState().currentSession;
    if (!isOnline) {
      await queueAction({
        id: newQueueId(),
        type: "checkpoint_complete",
        payload: { sessionId, checkpointId, note },
        queuedAt: new Date().toISOString(),
        status: "pending",
        retryCount: 0
      });
      return;
    }

    if (snapshot) {
      set({
        currentSession: {
          ...snapshot,
          checkpoints: snapshot.checkpoints.map((checkpoint) =>
            checkpoint.id === checkpointId
              ? {
                  ...checkpoint,
                  status: "completed",
                  notes: note,
                  completedAt: new Date().toISOString()
                }
              : checkpoint
          )
        }
      });
    }

    try {
      await getClient().completeCheckpoint(sessionId, checkpointId, {
        actor: {
          actorType: "user",
          userId: useAuthStore.getState().session?.user.id
        },
        note
      });
      await useSessionStore.getState().fetchSession(sessionId);
    } catch (error) {
      set({ currentSession: snapshot });
      throw error;
    }
  },
  async submitArtifact({ sessionId, artifact, isOnline = true }) {
    if (!isOnline) {
      await queueAction({
        id: newQueueId(),
        type: "artifact_submit",
        payload: { sessionId, artifact },
        queuedAt: new Date().toISOString(),
        status: "pending",
        retryCount: 0
      });
      return;
    }

    await getClient().submitArtifactPayload({ sessionId, artifact });
    await useSessionStore.getState().fetchSession(sessionId);
  },
  invalidate() {
    set({
      homeSummary: null,
      currentSession: null,
      scoring: null,
      events: [],
      results: [],
      lastFetchedAt: undefined,
      cacheState: "missing"
    });
  }
}));
