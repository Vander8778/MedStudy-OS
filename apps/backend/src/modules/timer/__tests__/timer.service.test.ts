import { describe, expect, it, vi } from "vitest";
import { TimerService } from "../timer.service";

describe("TimerService", () => {
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
});
