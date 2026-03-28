import { Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimerService } from "../timer.service";

describe("TimerService", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reloads session state from persistence before invoking the timer callback", async () => {
    const callOrder: string[] = [];
    const prisma = {
      session: {
        findUniqueOrThrow: vi.fn(async () => {
          callOrder.push("reload");
          return { id: "session_1" };
        })
      }
    };

    const service = new TimerService(prisma as never);

    await service.runWithFreshSession("session_1", async () => {
      callOrder.push("callback");
    });

    expect(callOrder).toEqual(["reload", "callback"]);
  });

  it("logs timer callback failures instead of silently swallowing them", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T09:00:00.000Z"));

    const prisma = {
      session: {
        findUniqueOrThrow: vi.fn(async () => ({ id: "session_1" }))
      }
    };
    const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const service = new TimerService(prisma as never);

    service.scheduleSessionReview(
      "session_1",
      "2026-03-28T09:00:00.000Z",
      async () => {
        throw new Error("boom");
      }
    );

    await vi.runAllTimersAsync();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Timer callback failed for session session_1 (session_review): boom"),
      expect.any(String)
    );
  });
});
