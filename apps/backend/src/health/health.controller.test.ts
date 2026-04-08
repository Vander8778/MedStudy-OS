import { afterEach, describe, expect, it } from "vitest";
import { resetEnvForTests } from "../config/env";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  afterEach(() => {
    resetEnvForTests();
    delete process.env.NODE_ENV;
    delete process.env.HEALTH_DEEP_TOKEN;
  });

  it("returns 503 when readiness checks fail", async () => {
    const controller = new HealthController({
      getLiveness: async () => ({ ok: true }),
      getReadiness: async () => ({
        ok: false,
        details: {
          database: { ok: true },
          redis: { ok: false }
        }
      }),
      getDeepHealth: async () => ({ ok: true, details: {} })
    } as never);
    const response = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      }
    };

    const result = await controller.ready(response as never);

    expect(response.statusCode).toBe(503);
    expect(result.ok).toBe(false);
  });

  it("rejects deep health requests without the configured token", async () => {
    process.env.NODE_ENV = "development";
    process.env.HEALTH_DEEP_TOKEN = "secret-token";
    resetEnvForTests();

    const controller = new HealthController({
      getLiveness: async () => ({ ok: true }),
      getReadiness: async () => ({ ok: true, details: {} }),
      getDeepHealth: async () => ({ ok: true, details: {} })
    } as never);

    await expect(
      controller.deepHealth(undefined, "wrong-token", {
        status() {
          return this;
        }
      } as never)
    ).rejects.toThrow("Deep health access is restricted.");
  });
});
