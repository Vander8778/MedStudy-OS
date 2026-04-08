import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
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
});
