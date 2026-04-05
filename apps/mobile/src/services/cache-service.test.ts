import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CACHE_KEYS,
  getCacheFreshness,
  getQueuedActions,
  processQueuedActions,
  queueAction,
  readCacheEntry,
  setCacheStorageForTests,
  writeCacheEntry
} from "./cache-service";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn(async (key: string) => values.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      values.delete(key);
    })
  };
}

describe("cache service", () => {
  beforeEach(() => {
    setCacheStorageForTests(createStorage());
    vi.setSystemTime(new Date("2026-04-05T12:00:00.000Z"));
  });

  it("detects fresh, stale, and expired cache entries", () => {
    expect(getCacheFreshness("2026-04-05T11:30:00.000Z")).toBe("fresh");
    expect(getCacheFreshness("2026-04-04T09:00:00.000Z")).toBe("stale");
    expect(getCacheFreshness("2026-03-20T09:00:00.000Z")).toBe("expired");
  });

  it("stores timestamped cache entries", async () => {
    await writeCacheEntry(CACHE_KEYS.profile, { name: "Ada" });
    const cached = await readCacheEntry<{ name: string }>(CACHE_KEYS.profile);
    expect(cached?.data.name).toBe("Ada");
    expect(cached?.cachedAt).toBeDefined();
  });

  it("retries queued safe actions with a bounded limit", async () => {
    await queueAction({
      id: "action_1",
      type: "checkpoint_complete",
      payload: { sessionId: "session_1", checkpointId: "checkpoint_1" },
      queuedAt: "2026-04-05T11:00:00.000Z",
      status: "pending",
      retryCount: 0
    });

    let attempts = 0;
    const failures = await processQueuedActions({
      checkpoint_complete: async () => {
        attempts += 1;
        throw new Error("Still offline");
      }
    });

    expect(attempts).toBe(1);
    expect(failures[0]?.retryCount).toBe(1);
    expect((await getQueuedActions()).length).toBe(1);
  });
});
