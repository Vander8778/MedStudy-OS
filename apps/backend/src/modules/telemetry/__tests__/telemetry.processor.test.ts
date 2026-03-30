import { describe, expect, it, vi } from "vitest";
import { TelemetryProcessor } from "../telemetry.processor";

describe("TelemetryProcessor", () => {
  it("persists a single event and registers the session for deferred analysis", async () => {
    const telemetryRepository = {
      createEvent: vi.fn(async () => ({
        event: { id: "telemetry_1" },
        duplicate: false
      }))
    };
    const scheduler = {
      registerSession: vi.fn()
    };
    const processor = new TelemetryProcessor(
      telemetryRepository as never,
      scheduler as never
    );

    const result = await processor.ingestEvent({
      userId: "user_1",
      sessionId: "session_1",
      clientEventId: "client_1",
      source: "desktop",
      type: "heartbeat",
      occurredAt: "2026-03-30T09:10:00.000Z",
      receivedAt: "2026-03-30T09:10:05.000Z",
      payload: {}
    });

    expect(telemetryRepository.createEvent).toHaveBeenCalledTimes(1);
    expect(scheduler.registerSession).toHaveBeenCalledWith("session_1");
    expect(result).toEqual({
      telemetryEvent: { id: "telemetry_1" },
      accepted: true
    });
  });

  it("persists valid batch items while reporting duplicates and malformed events", async () => {
    const telemetryRepository = {
      createEvent: vi
        .fn()
        .mockResolvedValueOnce({
          event: { id: "telemetry_1" },
          duplicate: false
        })
        .mockResolvedValueOnce({
          event: { id: "telemetry_existing" },
          duplicate: true
        })
    };
    const scheduler = {
      registerSession: vi.fn()
    };
    const processor = new TelemetryProcessor(
      telemetryRepository as never,
      scheduler as never
    );

    const result = await processor.ingestBatch({
      events: [
        {
          userId: "user_1",
          sessionId: "session_1",
          clientEventId: "client_1",
          source: "desktop",
          type: "heartbeat",
          occurredAt: "2026-03-30T09:10:00.000Z",
          receivedAt: "2026-03-30T09:10:05.000Z",
          payload: {}
        },
        {
          userId: "user_1",
          sessionId: "session_1",
          clientEventId: "client_1",
          source: "desktop",
          type: "heartbeat",
          occurredAt: "2026-03-30T09:11:00.000Z",
          receivedAt: "2026-03-30T09:11:05.000Z",
          payload: {}
        },
        {
          userId: "user_1",
          sessionId: "session_1",
          source: "desktop",
          type: "heartbeat",
          occurredAt: "2026-03-30T09:12:00.000Z",
          receivedAt: "2026-03-30T09:11:59.000Z",
          payload: {}
        }
      ]
    });

    expect(telemetryRepository.createEvent).toHaveBeenCalledTimes(2);
    expect(scheduler.registerSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      results: [
        {
          clientEventId: "client_1",
          telemetryEventId: "telemetry_1",
          accepted: true
        },
        {
          clientEventId: "client_1",
          accepted: false,
          error: "Duplicate telemetry clientEventId for this session."
        },
        {
          accepted: false,
          error: "receivedAt must be on or after occurredAt"
        }
      ],
      acceptedCount: 1,
      rejectedCount: 2
    });
  });
});
