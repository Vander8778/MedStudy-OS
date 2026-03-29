import { describe, expect, it, vi } from "vitest";
import { AuthController } from "../auth.controller";

describe("AuthController", () => {
  it("delegates login once", async () => {
    const service = {
      login: vi.fn(() => ({
        token: "stub-token:user_1",
        user: { id: "user_1", email: "user@example.com", role: "student" }
      })),
      me: vi.fn()
    };
    const controller = new AuthController(service as never);

    const result = await controller.login({ email: "user@example.com" });

    expect(service.login).toHaveBeenCalledWith("user@example.com");
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(service.me).not.toHaveBeenCalled();
    expect(result.token).toBe("stub-token:user_1");
  });

  it("delegates me once", async () => {
    const service = {
      login: vi.fn(),
      me: vi.fn(() => ({
        id: "user_demo",
        email: "demo@medstudy.local",
        role: "student"
      }))
    };
    const controller = new AuthController(service as never);

    const result = await controller.me();

    expect(service.me).toHaveBeenCalledTimes(1);
    expect(service.login).not.toHaveBeenCalled();
    expect(result.email).toBe("demo@medstudy.local");
  });
});
