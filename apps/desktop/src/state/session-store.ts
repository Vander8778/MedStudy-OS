import type {
  CreateSessionRequest,
  GetEventsResponse,
  GetScoringResponse,
  GetSessionResponse,
  SessionState,
  SessionView
} from "@medstudy/contracts";
import { create } from "zustand";
import type {
  AuthSession,
  DesktopConfig,
  ScreenKey,
  SessionCheckpointPrompt
} from "../types";
import {
  getDueCheckpoint,
  isTerminalSessionState,
  resolveScreenKey
} from "../types";

type SessionStore = {
  config: DesktopConfig | null;
  auth: AuthSession | null;
  session: GetSessionResponse | null;
  scoring: GetScoringResponse["scoring"];
  events: GetEventsResponse["events"];
  optimisticState?: SessionState;
  lastSyncedAtMs?: number;
  sessionDraft: CreateSessionRequest;
  restoreSessionId: string;
  setConfig: (config: DesktopConfig) => void;
  setAuth: (auth: AuthSession | null) => void;
  setSession: (session: GetSessionResponse | null) => void;
  setScoring: (scoring: GetScoringResponse["scoring"]) => void;
  setEvents: (events: GetEventsResponse["events"]) => void;
  setOptimisticState: (state?: SessionState) => void;
  updateSessionDraft: (patch: Partial<CreateSessionRequest>) => void;
  setRestoreSessionId: (sessionId: string) => void;
  clearSession: () => void;
};

const defaultSessionDraft: CreateSessionRequest = {
  userId: "",
  profileId: "profile_demo",
  contractId: "contract_demo",
  title: "Focused Study Session",
  objective: "Review a planned topic with artifact evidence.",
  plannedRange: {
    startsAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    endsAt: new Date(Date.now() + 65 * 60_000).toISOString()
  },
  finalArtifactRequired: true
};

export const useSessionStore = create<SessionStore>((set) => ({
  config: null,
  auth: null,
  session: null,
  scoring: null,
  events: [],
  optimisticState: undefined,
  lastSyncedAtMs: undefined,
  sessionDraft: defaultSessionDraft,
  restoreSessionId: "",
  setConfig: (config) => set({ config }),
  setAuth: (auth) =>
    set((current) => ({
      auth,
      sessionDraft: {
        ...current.sessionDraft,
        userId: auth?.user.id ?? ""
      }
    })),
  setSession: (session) =>
    set((current) => ({
      session,
      lastSyncedAtMs: session ? Date.now() : undefined,
      optimisticState:
        session && current.optimisticState && current.optimisticState !== session.session.state
          ? undefined
          : current.optimisticState
    })),
  setScoring: (scoring) => set({ scoring }),
  setEvents: (events) => set({ events }),
  setOptimisticState: (optimisticState) => set({ optimisticState }),
  updateSessionDraft: (patch) =>
    set((current) => ({
      sessionDraft: {
        ...current.sessionDraft,
        ...patch
      }
    })),
  setRestoreSessionId: (restoreSessionId) => set({ restoreSessionId }),
  clearSession: () =>
    set({
      session: null,
      scoring: null,
      events: [],
      optimisticState: undefined,
      lastSyncedAtMs: undefined
    })
}));

export function getEffectiveSessionState(
  session: GetSessionResponse | null,
  optimisticState?: SessionState
) {
  return optimisticState ?? session?.session.state;
}

export function getCurrentScreen(store: Pick<SessionStore, "auth" | "session" | "optimisticState">): ScreenKey {
  if (!store.auth) {
    return "login";
  }

  return resolveScreenKey(getEffectiveSessionState(store.session, store.optimisticState));
}

export function getCheckpointPrompt(
  session: GetSessionResponse | null
): SessionCheckpointPrompt {
  return session ? getDueCheckpoint(session.checkpoints) : null;
}

export function shouldPersistSessionContext(session: SessionView | undefined) {
  return Boolean(session && !isTerminalSessionState(session.state));
}
