import { describe, expect, it } from "vitest";
import { buildSessionAggregate } from "../__fixtures__/session.factory";
import { buildTelemetryRecord } from "../__fixtures__/telemetry.factory";
import { createTelemetryIntegrationHarness } from "./helpers";

describe("telemetry anti-avoidance integration", () => {
  it("routes telemetry summaries through M5 and then through the orchestrator warning path", async () => {
    const harness = createTelemetryIntegrationHarness({
      aggregate: buildSessionAggregate({
        session: {
          state: "active_valid",
          startedAt: "2026-04-07T09:00:00.000Z",
          validMinutes: 20,
          invalidMinutes: 0
        }
      }),
      rawEvents: [
        buildTelemetryRecord({
          id: "telemetry_1",
          type: "window_changed",
          occurredAt: "2026-04-07T09:10:00.000Z",
          serverReceivedAt: "2026-04-07T09:10:01.000Z",
          payload: { nonStudyContextMinutes: 5, isStudyContext: false }
        }),
        buildTelemetryRecord({
          id: "telemetry_2",
          clientEventId: "client_event_2",
          type: "heartbeat",
          occurredAt: "2026-04-07T09:16:00.000Z",
          serverReceivedAt: "2026-04-07T09:16:01.000Z",
          payload: {}
        })
      ]
    });

    harness.scheduler.registerSession(harness.state.aggregate.session.id, 0);
    await harness.scheduler.tick(0);

    expect(harness.telemetryState.summaries).toHaveLength(1);
    expect(harness.telemetryState.summaries[0]?.nonStudyContextMinutes).toBe(5);
    expect(harness.state.antiAvoidanceResults).toHaveLength(1);
    expect(harness.state.antiAvoidanceResults[0]?.recommendedResponses).toContain(
      "raise_warning"
    );
    expect(harness.getAggregate().session.state).toBe("active_warning");
    expect(harness.getAggregate().events.map((event) => event.type)).toContain(
      "warning_raised"
    );
    expect(harness.telemetryRepository.saveSummary).toHaveBeenCalledTimes(1);
    expect(harness.sessionRepository.saveSession).toHaveBeenCalled();
  });
});
