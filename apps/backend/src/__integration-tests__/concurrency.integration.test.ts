import { describe, expect, it } from "vitest";
import { buildSessionAggregate } from "../__fixtures__/session.factory";
import { buildTelemetryRecord } from "../__fixtures__/telemetry.factory";
import { createSessionIntegrationHarness, createTelemetryIntegrationHarness } from "./helpers";

describe("bounded concurrency integration", () => {
  it("rejects duplicate pause requests once the session has already moved forward", async () => {
    const harness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "active_valid",
          startedAt: "2026-04-07T09:00:00.000Z"
        }
      })
    );

    await harness.orchestrator.pauseSession("session_fixture");

    await expect(harness.orchestrator.pauseSession("session_fixture")).rejects.toThrow(
      'Event "paused" is not allowed from state "paused_valid".'
    );
  });

  it("skips overlapping telemetry worker calls for the same session", async () => {
    const harness = createTelemetryIntegrationHarness({
      aggregate: buildSessionAggregate({
        session: {
          state: "active_valid",
          startedAt: "2026-04-07T09:00:00.000Z"
        }
      }),
      rawEvents: [buildTelemetryRecord()]
    });

    const first = harness.worker.processSessionAnalysis("session_fixture");
    const second = harness.worker.processSessionAnalysis("session_fixture");
    const results = await Promise.all([first, second]);

    expect(results.map((result) => result.status).sort()).toEqual([
      "processed",
      "skipped"
    ]);
    expect(results.find((result) => result.status === "skipped")).toMatchObject({
      reason: "already_running"
    });
  });
});
