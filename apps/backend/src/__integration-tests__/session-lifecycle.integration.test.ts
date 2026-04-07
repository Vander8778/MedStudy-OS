import { describe, expect, it } from "vitest";
import { buildContract } from "../__fixtures__/contract.factory";
import { buildSession } from "../__fixtures__/session.factory";
import { createSessionIntegrationHarness } from "./helpers";

describe("session lifecycle integration", () => {
  it("drives the happy path through real orchestration and explainability outputs", async () => {
    const contract = buildContract({
      terms: {
        minValidMinutes: 45,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70,
        checkpointIntervalMinutes: 30,
        maxPauseMinutes: 10
      }
    });
    const harness = createSessionIntegrationHarness();
    harness.state.aggregate.contract = contract;

    const aggregate = await harness.orchestrator.createSession({
      userId: "user_fixture",
      profileId: "profile_fixture",
      contractId: contract.id,
      title: "Lifecycle integration",
      objective: "Validate planned to completed wiring.",
      plannedRange: {
        startsAt: "2026-04-07T09:00:00.000Z",
        endsAt: "2026-04-07T10:00:00.000Z"
      },
      finalArtifactRequired: true
    });

    await harness.orchestrator.armSession(aggregate.session.id);
    await harness.orchestrator.confirmArmSession(aggregate.session.id);
    await harness.orchestrator.startSession(aggregate.session.id);
    harness.state.aggregate.session = buildSession({
      ...harness.state.aggregate.session,
      state: "active_valid",
      startedAt: "2026-04-07T09:00:00.000Z",
      validMinutes: 55,
      invalidMinutes: 0,
      warningCount: 0,
      missedCheckpointCount: 0,
      updatedAt: "2026-04-07T09:55:00.000Z"
    });
    harness.state.aggregate.vivaAttempts = [
      {
        id: "viva_1",
        sessionId: aggregate.session.id,
        status: "passed",
        completedAt: "2026-04-07T09:54:00.000Z",
        score: 88,
        passingScore: 70,
        createdAt: "2026-04-07T09:50:00.000Z",
        updatedAt: "2026-04-07T09:54:00.000Z"
      }
    ];

    await harness.orchestrator.submitArtifact(aggregate.session.id, {
      type: "final_submission",
      title: "Final notes",
      source: "user_upload",
      status: "submitted",
      createdByUserId: "user_fixture"
    });

    const review = await harness.orchestrator.requestReview(aggregate.session.id, {
      actor: { actorType: "user", userId: "user_fixture", label: "integration.test" }
    });

    expect(review.session.state).toBe("completed");
    expect(review.scoring.outcome).toBe("completed");
    expect(review.contractEvaluation.allRulesPassed).toBe(true);
    expect(harness.state.scoring?.outcome).toBe("completed");
    expect(harness.state.contractEvaluation?.allRulesPassed).toBe(true);
    expect(harness.state.domainEvents.length).toBeGreaterThan(0);
    expect(harness.getAggregate().events.map((event) => event.type)).toEqual([
      "planned",
      "arming_started",
      "armed",
      "started",
      "artifact_submitted",
      "review_requested",
      "completed"
    ]);
    expect(harness.timerService.clearAllForSession).toHaveBeenCalledWith(
      aggregate.session.id
    );
  });
});
