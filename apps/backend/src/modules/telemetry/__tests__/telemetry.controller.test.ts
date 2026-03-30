import { describe, expect, it, vi } from "vitest";
import { TelemetryController } from "../telemetry.controller";

describe("TelemetryController", () => {
  it("delegates ingestTelemetry once and returns the persist-only ingest response", async () => {
    const processor = {
      ingestEvent: vi.fn(async () => ({
        telemetryEvent: { id: "telemetry_1" },
        accepted: true
      })),
      ingestBatch: vi.fn()
    };
    const controller = new TelemetryController(processor as never);

    const result = await controller.ingestTelemetry({
      userId: "user_1",
      sessionId: "session_1",
      clientEventId: "client_1",
      source: "desktop",
      type: "heartbeat",
      occurredAt: "2026-03-29T09:00:00.000Z",
      receivedAt: "2026-03-29T09:00:01.000Z",
      payload: {}
    });

    expect(processor.ingestEvent).toHaveBeenCalledTimes(1);
    expect(result.telemetryEventId).toBe("telemetry_1");
    expect(result.accepted).toBe(true);
    expect("antiAvoidance" in result).toBe(false);
  });

  it("delegates ingestTelemetryBatch once and returns the mapped batch response", async () => {
    const processor = {
      ingestEvent: vi.fn(),
      ingestBatch: vi.fn(async () => ({
        results: [
          {
            clientEventId: "client_1",
            telemetryEventId: "telemetry_1",
            accepted: true
          },
          {
            clientEventId: "client_2",
            accepted: false,
            error: "Duplicate telemetry clientEventId for this session."
          }
        ],
        acceptedCount: 1,
        rejectedCount: 1
      }))
    };
    const controller = new TelemetryController(processor as never);

    const result = await controller.ingestTelemetryBatch({
      events: [
        {
          userId: "user_1",
          sessionId: "session_1",
          clientEventId: "client_1",
          source: "desktop",
          type: "heartbeat",
          occurredAt: "2026-03-29T09:00:00.000Z",
          receivedAt: "2026-03-29T09:00:01.000Z",
          payload: {}
        }
      ]
    });

    expect(processor.ingestBatch).toHaveBeenCalledTimes(1);
    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
  });
});
