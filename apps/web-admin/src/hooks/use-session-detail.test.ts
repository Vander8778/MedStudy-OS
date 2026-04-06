import { describe, expect, it, vi } from "vitest";
import { executeSessionMutationAndRefresh } from "./use-session-detail";

describe("session detail mutation flow", () => {
  it("refreshes after a successful mutation without optimistic local writes", async () => {
    const mutate = vi.fn(async () => {});
    const refresh = vi.fn(async () => {});

    await executeSessionMutationAndRefresh({ mutate, refresh });

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(mutate.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
      refresh.mock.invocationCallOrder[0] ?? 0
    );
  });
});
