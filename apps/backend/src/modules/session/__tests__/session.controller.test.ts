import { describe, expect, it, vi } from "vitest";
import { SessionController } from "../session.controller";

describe("SessionController", () => {
  it("remains thin and delegates mutating calls to the orchestrator", async () => {
    const orchestrator = {
      startSession: vi.fn(async () => ({ id: "session_1", state: "active_valid" }))
    };
    const controller = new SessionController(orchestrator as never);

    await controller.startSession("session_1", {
      actor: { actorType: "user" }
    });

    expect(orchestrator.startSession).toHaveBeenCalledWith("session_1", {
      actorType: "user"
    });
  });
});
