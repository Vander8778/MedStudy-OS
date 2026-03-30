import { describe, expect, it } from "vitest";
import { buildTelemetrySummary } from "../telemetry-summary.builder";
import type { TelemetryEventRecord } from "../telemetry.repository";

function createEvent(
  overrides: Partial<TelemetryEventRecord> & Pick<TelemetryEventRecord, "id" | "type">
): TelemetryEventRecord {
  return {
    id: overrides.id,
    userId: "user_1",
    sessionId: "session_1",
    clientEventId: overrides.clientEventId,
    source: overrides.source ?? "desktop",
    type: overrides.type,
    occurredAt: overrides.occurredAt ?? "2026-03-30T09:00:00.000Z",
    receivedAt: overrides.receivedAt ?? "2026-03-30T09:00:01.000Z",
    serverReceivedAt:
      overrides.serverReceivedAt ?? "2026-03-30T09:00:01.000Z",
    payload: overrides.payload ?? {},
    createdAt: overrides.createdAt ?? "2026-03-30T09:00:01.000Z"
  };
}

describe("buildTelemetrySummary", () => {
  it("aggregates mixed event types into one normalized summary window", () => {
    const summary = buildTelemetrySummary({
      session: {
        id: "session_1",
        state: "active_warning",
        startedAt: "2026-03-30T09:00:00.000Z",
        createdAt: "2026-03-30T08:55:00.000Z",
        validMinutes: 25,
        invalidMinutes: 3,
        warningCount: 2,
        missedCheckpointCount: 1,
        currentWarningDurationMinutes: 4
      },
      rawEvents: [
        createEvent({
          id: "event_2",
          type: "window_changed",
          serverReceivedAt: "2026-03-30T09:05:00.000Z",
          payload: { isStudyContext: false, durationMinutes: 2 }
        }),
        createEvent({
          id: "event_1",
          type: "input_activity",
          serverReceivedAt: "2026-03-30T09:04:00.000Z",
          payload: { activityCount: 2 }
        }),
        createEvent({
          id: "event_3",
          type: "focus_changed",
          serverReceivedAt: "2026-03-30T09:06:00.000Z"
        }),
        createEvent({
          id: "event_4",
          type: "input_activity",
          serverReceivedAt: "2026-03-30T09:07:00.000Z",
          payload: { hasMeaningfulInput: true }
        }),
        createEvent({
          id: "event_5",
          type: "input_activity",
          serverReceivedAt: "2026-03-30T09:08:00.000Z",
          payload: { pointerEventCount: 4 }
        })
      ],
      now: "2026-03-30T09:08:00.000Z"
    });

    expect(summary.windowStartsAt).toBe("2026-03-30T09:04:00.000Z");
    expect(summary.windowEndsAt).toBe("2026-03-30T09:08:00.000Z");
    expect(summary.rawEventCount).toBe(5);
    expect(summary.contextSwitchCount).toBe(2);
    expect(summary.nonStudyContextMinutes).toBe(2);
    expect(summary.nonStudyContextDetected).toBe(true);
    expect(summary.inputActivityLevel).toBe("normal");
    expect(summary.sessionElapsedMinutes).toBe(8);
    expect(summary.sessionValidMinutes).toBe(25);
    expect(summary.sessionWarningCount).toBe(2);
    expect(summary.currentWarningActive).toBe(true);
    expect(summary.currentWarningDurationMinutes).toBe(4);
  });

  it("handles an empty event window without inventing telemetry metrics", () => {
    const summary = buildTelemetrySummary({
      session: {
        id: "session_1",
        state: "active_valid",
        createdAt: "2026-03-30T08:55:00.000Z",
        validMinutes: 0,
        invalidMinutes: 0,
        warningCount: 0,
        missedCheckpointCount: 0,
        currentWarningDurationMinutes: 0
      },
      rawEvents: [],
      now: "2026-03-30T09:00:00.000Z"
    });

    expect(summary.rawEventCount).toBe(0);
    expect(summary.lastRawEventId).toBe("");
    expect(summary.windowStartsAt).toBe("2026-03-30T09:00:00.000Z");
    expect(summary.windowEndsAt).toBe("2026-03-30T09:00:00.000Z");
    expect(summary.idleMinutes).toBe(0);
    expect(summary.contextSwitchCount).toBe(0);
    expect(summary.inputActivityLevel).toBe("none");
  });

  it("computes idle stretch from heartbeat gaps using serverReceivedAt as the authoritative clock", () => {
    const summary = buildTelemetrySummary({
      session: {
        id: "session_1",
        state: "active_valid",
        startedAt: "2026-03-30T09:00:00.000Z",
        createdAt: "2026-03-30T08:55:00.000Z",
        validMinutes: 10,
        invalidMinutes: 0,
        warningCount: 0,
        missedCheckpointCount: 0,
        currentWarningDurationMinutes: 0
      },
      rawEvents: [
        createEvent({
          id: "heartbeat_late",
          type: "heartbeat",
          occurredAt: "2026-03-30T09:01:00.000Z",
          serverReceivedAt: "2026-03-30T09:10:00.000Z"
        }),
        createEvent({
          id: "heartbeat_early",
          type: "heartbeat",
          occurredAt: "2026-03-30T09:09:00.000Z",
          serverReceivedAt: "2026-03-30T09:02:00.000Z"
        })
      ],
      now: "2026-03-30T09:10:00.000Z"
    });

    expect(summary.windowStartsAt).toBe("2026-03-30T09:02:00.000Z");
    expect(summary.windowEndsAt).toBe("2026-03-30T09:10:00.000Z");
    expect(summary.idleMinutes).toBe(8);
    expect(summary.longestIdleStretchMinutes).toBe(8);
  });

  it("classifies input activity levels across none, minimal, and normal windows", () => {
    const none = buildTelemetrySummary({
      session: {
        id: "session_1",
        state: "active_valid",
        createdAt: "2026-03-30T08:55:00.000Z",
        validMinutes: 0,
        invalidMinutes: 0,
        warningCount: 0,
        missedCheckpointCount: 0,
        currentWarningDurationMinutes: 0
      },
      rawEvents: [createEvent({ id: "event_none", type: "heartbeat" })],
      now: "2026-03-30T09:00:00.000Z"
    });
    const minimal = buildTelemetrySummary({
      session: {
        id: "session_1",
        state: "active_valid",
        createdAt: "2026-03-30T08:55:00.000Z",
        validMinutes: 0,
        invalidMinutes: 0,
        warningCount: 0,
        missedCheckpointCount: 0,
        currentWarningDurationMinutes: 0
      },
      rawEvents: [
        createEvent({
          id: "event_minimal",
          type: "input_activity",
          payload: { activityCount: 1 }
        })
      ],
      now: "2026-03-30T09:00:00.000Z"
    });
    const normal = buildTelemetrySummary({
      session: {
        id: "session_1",
        state: "active_valid",
        createdAt: "2026-03-30T08:55:00.000Z",
        validMinutes: 0,
        invalidMinutes: 0,
        warningCount: 0,
        missedCheckpointCount: 0,
        currentWarningDurationMinutes: 0
      },
      rawEvents: [
        createEvent({ id: "event_normal_1", type: "input_activity", payload: { activityCount: 1 } }),
        createEvent({ id: "event_normal_2", type: "input_activity", payload: { activityCount: 1 } }),
        createEvent({ id: "event_normal_3", type: "input_activity", payload: { activityCount: 1 } })
      ],
      now: "2026-03-30T09:00:00.000Z"
    });

    expect(none.inputActivityLevel).toBe("none");
    expect(minimal.inputActivityLevel).toBe("minimal");
    expect(normal.inputActivityLevel).toBe("normal");
  });
});
