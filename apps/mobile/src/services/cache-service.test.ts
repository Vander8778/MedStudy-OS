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

  it("processes artifact and avatar queued actions through their processors", async () => {
    await queueAction({
      id: "artifact_1",
      type: "artifact_submit",
      payload: {
        sessionId: "session_1",
        artifact: {
          type: "note",
          title: "Reflection",
          source: "manual_entry",
          status: "submitted"
        }
      },
      queuedAt: "2026-04-05T11:00:00.000Z",
      status: "pending",
      retryCount: 0
    });
    await queueAction({
      id: "avatar_1",
      type: "avatar_equip",
      payload: {
        avatarId: "avatar_7"
      },
      queuedAt: "2026-04-05T11:05:00.000Z",
      status: "pending",
      retryCount: 0
    });

    const artifactProcessor = vi.fn(async () => {});
    const avatarProcessor = vi.fn(async () => {});

    const failures = await processQueuedActions({
      artifact_submit: artifactProcessor,
      avatar_equip: avatarProcessor
    });

    expect(failures).toEqual([]);
    expect(artifactProcessor).toHaveBeenCalledTimes(1);
    expect(avatarProcessor).toHaveBeenCalledTimes(1);
    expect(await getQueuedActions()).toEqual([]);
  });
});
