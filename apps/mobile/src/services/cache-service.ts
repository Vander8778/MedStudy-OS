import { CACHE_POLICY, OFFLINE_QUEUE } from "../utils/constants";
import type { CacheEntry, CacheFreshness, QueuedAction } from "../types/app";

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const memoryStorage = new Map<string, string>();

const fallbackStorage: StorageLike = {
  async getItem(key) {
    return memoryStorage.get(key) ?? null;
  },
  async setItem(key, value) {
    memoryStorage.set(key, value);
  },
  async removeItem(key) {
    memoryStorage.delete(key);
  }
};

export const CACHE_KEYS = {
  currentSession: "mobile:cache:current-session",
  contract: "mobile:cache:contract",
  results: "mobile:cache:results",
  progress: "mobile:cache:progress",
  profile: "mobile:cache:profile",
  queuedActions: "mobile:cache:queued-actions"
} as const;

let storageOverride: StorageLike | undefined;

export function setCacheStorageForTests(storage: StorageLike | undefined) {
  storageOverride = storage;
}

async function getStorage(): Promise<StorageLike> {
  if (storageOverride) {
    return storageOverride;
  }

  try {
    const module = await import("@react-native-async-storage/async-storage");
    return module.default;
  } catch {
    return fallbackStorage;
  }
}

export function getCacheFreshness(cachedAt?: string): CacheFreshness {
  if (!cachedAt) {
    return "missing";
  }

  const ageMs = Date.now() - new Date(cachedAt).getTime();
  if (Number.isNaN(ageMs)) {
    return "missing";
  }

  if (ageMs > CACHE_POLICY.expiredAfterMs) {
    return "expired";
  }

  if (ageMs > CACHE_POLICY.staleAfterMs) {
    return "stale";
  }

  return "fresh";
}

export async function writeCacheEntry<T>(key: string, data: T) {
  const storage = await getStorage();
  const entry: CacheEntry<T> = {
    cachedAt: new Date().toISOString(),
    data
  };
  await storage.setItem(key, JSON.stringify(entry));
  return entry;
}

export async function readCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  const storage = await getStorage();
  const raw = await storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    await storage.removeItem(key);
    return null;
  }
}

export async function clearCacheEntry(key: string) {
  const storage = await getStorage();
  await storage.removeItem(key);
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const entry = await readCacheEntry<QueuedAction[]>(CACHE_KEYS.queuedActions);
  return entry?.data ?? [];
}

export async function queueAction(action: QueuedAction) {
  const existing = await getQueuedActions();
  const next = [...existing, action];
  await writeCacheEntry(CACHE_KEYS.queuedActions, next);
  return next;
}

export async function updateQueuedAction(
  id: string,
  updater: (action: QueuedAction) => QueuedAction
) {
  const existing = await getQueuedActions();
  const next = existing.map((action) => (action.id === id ? updater(action) : action));
  await writeCacheEntry(CACHE_KEYS.queuedActions, next);
  return next;
}

export async function removeQueuedAction(id: string) {
  const existing = await getQueuedActions();
  const next = existing.filter((action) => action.id !== id);
  await writeCacheEntry(CACHE_KEYS.queuedActions, next);
  return next;
}

export type QueueProcessorMap = Partial<
  Record<QueuedAction["type"], (action: QueuedAction) => Promise<void>>
>;

export async function processQueuedActions(processors: QueueProcessorMap) {
  const actions = await getQueuedActions();
  const failures: QueuedAction[] = [];

  for (const action of actions) {
    const processor = processors[action.type];
    if (!processor) {
      failures.push({
        ...action,
        status: "failed",
        failureReason: "No processor configured.",
        retryCount: action.retryCount + 1
      });
      continue;
    }

    try {
      await processor(action);
    } catch (error) {
      const retryCount = action.retryCount + 1;
      failures.push({
        ...action,
        status: retryCount >= OFFLINE_QUEUE.maxRetries ? "failed" : "pending",
        failureReason:
          error instanceof Error ? error.message : "Queue action failed.",
        retryCount
      });
    }
  }

  await writeCacheEntry(CACHE_KEYS.queuedActions, failures);
  return failures;
}
