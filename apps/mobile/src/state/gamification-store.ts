import type { ProgressSummary } from "@medstudy/contracts";
import { create } from "zustand";
import {
  CACHE_KEYS,
  getCacheFreshness,
  queueAction,
  readCacheEntry,
  writeCacheEntry
} from "../services/cache-service";
import { getMobileApiClient } from "../services/mobile-api";
import type { AvatarCatalogItem, ProgressResponse } from "../types/app";

type GamificationStore = {
  progress: ProgressSummary | null;
  avatars: readonly AvatarCatalogItem[];
  equippedAvatarId?: string;
  recentXpAwards: ProgressResponse["recentXpAwards"];
  isLoading: boolean;
  error?: string;
  cacheState: "fresh" | "stale" | "expired" | "missing";
  fetchProgress: () => Promise<ProgressSummary | null>;
  equipAvatar: (avatarId: string, isOnline?: boolean) => Promise<void>;
  invalidate: () => void;
};

function newQueueId() {
  return globalThis.crypto?.randomUUID?.() ?? `queue_${Date.now()}_${Math.random()}`;
}

export const useGamificationStore = create<GamificationStore>((set) => ({
  progress: null,
  avatars: [],
  equippedAvatarId: undefined,
  recentXpAwards: [],
  isLoading: false,
  error: undefined,
  cacheState: "missing",
  async fetchProgress() {
    set({ isLoading: true, error: undefined });
    try {
      const response = await getMobileApiClient().getProgress();
      await writeCacheEntry(CACHE_KEYS.progress, response);
      set({
        progress: response.progress,
        avatars: response.avatars,
        equippedAvatarId:
          response.equippedAvatar?.id ??
          response.avatars.find((item) => item.equipped)?.avatar.id,
        recentXpAwards: response.recentXpAwards,
        isLoading: false,
        cacheState: "fresh"
      });
      return response.progress;
    } catch (error) {
      const cached = await readCacheEntry<ProgressResponse>(CACHE_KEYS.progress);
      const cacheState = getCacheFreshness(cached?.cachedAt);
      set({
        progress: cacheState === "expired" ? null : cached?.data.progress ?? null,
        avatars: cacheState === "expired" ? [] : cached?.data.avatars ?? [],
        equippedAvatarId:
          cacheState === "expired"
            ? undefined
            : cached?.data.equippedAvatar?.id ??
              cached?.data.avatars.find((item) => item.equipped)?.avatar.id,
        recentXpAwards: cacheState === "expired" ? [] : cached?.data.recentXpAwards ?? [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load progress.",
        cacheState
      });
      return cacheState === "expired" ? null : cached?.data.progress ?? null;
    }
  },
  async equipAvatar(avatarId, isOnline = true) {
    if (!isOnline) {
      await queueAction({
        id: newQueueId(),
        type: "avatar_equip",
        payload: { avatarId },
        queuedAt: new Date().toISOString(),
        status: "pending",
        retryCount: 0
      });
      set({ equippedAvatarId: avatarId });
      return;
    }

    const previous = useGamificationStore.getState().equippedAvatarId;
    set({ equippedAvatarId: avatarId });
    try {
      await getMobileApiClient().equipAvatar(avatarId);
      await useGamificationStore.getState().fetchProgress();
    } catch (error) {
      set({ equippedAvatarId: previous });
      throw error;
    }
  },
  invalidate() {
    set({
      progress: null,
      avatars: [],
      equippedAvatarId: undefined,
      recentXpAwards: [],
      error: undefined,
      cacheState: "missing"
    });
  }
}));
