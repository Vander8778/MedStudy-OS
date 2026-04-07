import { describe, expect, it } from "vitest";
import { buildSessionAggregate } from "../__fixtures__/session.factory";
import { buildTelemetryBatch } from "../__fixtures__/telemetry.factory";
import { SessionAlreadyDecidedException } from "../common/exceptions";
import { createSessionIntegrationHarness, createTelemetryIntegrationHarness } from "./helpers";

describe("idempotency and replay hardening integration", () => {
  it("rejects duplicate telemetry clientEventIds inside the same session", async () => {
    const harness = createTelemetryIntegrationHarness();
    const batch = buildTelemetryBatch({
      events: [
        { clientEventId: "dup_1" },
        { clientEventId: "dup_1" }
      ]
    });

    const response = await harness.processor.ingestBatch(batch);

    expect(response.acceptedCount).toBe(1);
    expect(response.rejectedCount).toBe(1);
    expect(response.results[1]).toMatchObject({
      accepted: false,
      error: "Duplicate telemetry clientEventId for this session."
    });
  });

  it("does not reopen decided sessions when duplicate terminal processing or late artifacts arrive", async () => {
    const harness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "completed",
          startedAt: "2026-04-07T09:00:00.000Z",
          endedAt: "2026-04-07T10:00:00.000Z",
          validMinutes: 60
        }
      })
    );

    const first = await harness.orchestrator.submitArtifact("session_fixture", {
      type: "final_submission",
      title: "Late evidence A",
      source: "user_upload",
      status: "submitted"
    });
    const second = await harness.orchestrator.submitArtifact("session_fixture", {
      type: "final_submission",
      title: "Late evidence B",
      source: "user_upload",
      status: "submitted"
    });

    await expect(harness.orchestrator.requestReview("session_fixture")).rejects.toBeInstanceOf(
      SessionAlreadyDecidedException
    );
    expect(first.id).not.toBe(second.id);
    expect(harness.getAggregate().session.state).toBe("completed");
    expect(harness.getAggregate().artifacts).toHaveLength(2);
  });
});
