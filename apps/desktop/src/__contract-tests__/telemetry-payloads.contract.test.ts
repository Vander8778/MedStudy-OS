import { describe, expect, it } from "vitest";
import {
  batchIngestRequestSchema,
  ingestTelemetryRequestSchema
} from "@medstudy/contracts";

describe("desktop telemetry payload contract compliance", () => {
  it("accepts representative desktop heartbeat and input activity payloads", () => {
    expect(
      ingestTelemetryRequestSchema.parse({
        userId: "user_fixture",
        sessionId: "session_fixture",
        clientEventId: "heartbeat_1",
        source: "desktop",
        type: "heartbeat",
        occurredAt: "2026-04-07T09:10:00.000Z",
        receivedAt: "2026-04-07T09:10:01.000Z",
        payload: {
          activeWindowTitle: "MedStudy Desktop"
        }
      })
    ).toMatchObject({
      source: "desktop",
      type: "heartbeat"
    });

    expect(
      batchIngestRequestSchema.parse({
        events: [
          {
            userId: "user_fixture",
            sessionId: "session_fixture",
            clientEventId: "input_1",
            source: "desktop",
            type: "input_activity",
            occurredAt: "2026-04-07T09:11:00.000Z",
            receivedAt: "2026-04-07T09:11:01.000Z",
            payload: {
              activityCount: 4
            }
          }
        ]
      })
    ).toEqual({
      events: [
        expect.objectContaining({
          type: "input_activity"
        })
      ]
    });
  });
});
