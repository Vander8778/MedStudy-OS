import { describe, expect, it, vi } from "vitest";
import { TelemetryController } from "../telemetry.controller";

describe("TelemetryController", () => {
  it("delegates ingestTelemetry once and returns the mapped ingest response", async () => {
    const processor = {
      ingestEvent: vi.fn(async () => ({
        telemetryEvent: { id: "telemetry_1" },
        antiAvoidance: {
          patterns: [],
          overallSeverity: "high",
          hasEscalationSignal: true,
          recommendedResponses: ["raise_warning"]
        }
      }))
    };
    const controller = new TelemetryController(processor as never);

    const result = await controller.ingestTelemetry({
      userId: "user_1",
      sessionId: "session_1",
      source: "desktop",
      type: "heartbeat",
      occurredAt: "2026-03-29T09:00:00.000Z",
      receivedAt: "2026-03-29T09:00:01.000Z",
      payload: {}
    });

    expect(processor.ingestEvent).toHaveBeenCalledTimes(1);
    expect(result.telemetryEventId).toBe("telemetry_1");
    expect(result.antiAvoidance?.overallSeverity).toBe("high");
  });
});
