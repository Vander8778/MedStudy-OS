import { describe, expect, it } from "vitest";
import { buildSessionAggregate } from "../__fixtures__/session.factory";
import { createSessionIntegrationHarness } from "./helpers";

function buildCheckpoints(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `checkpoint_${index + 1}`,
    sessionId: "session_fixture",
    order: index + 1,
    title: `Checkpoint ${index + 1}`,
    status: "pending" as const,
    dueAt: `2026-04-07T09:${String((index + 1) * 10).padStart(2, "0")}:00.000Z`,
    createdAt: "2026-04-07T09:00:00.000Z",
    updatedAt: "2026-04-07T09:00:00.000Z"
  }));
}

function createReviewHarness(
  overrides: Parameters<typeof buildSessionAggregate>[0] = {}
) {
  const {
    session: sessionOverrides,
    artifacts: artifactsOverrides,
    vivaAttempts: vivaAttemptsOverrides,
    ...remainingOverrides
  } = overrides;
  const baseSession = {
    state: "active_valid",
    startedAt: "2026-04-07T09:00:00.000Z",
    validMinutes: 55,
    invalidMinutes: 0,
    warningCount: 0,
    missedCheckpointCount: 0,
    updatedAt: "2026-04-07T09:55:00.000Z"
  } as const;
  const baseArtifacts = [
    {
      id: "artifact_final",
      sessionId: "session_fixture",
      type: "final_submission",
      source: "user_upload",
      status: "submitted",
      title: "Final artifact",
      isMandatory: true,
      createdAt: "2026-04-07T09:50:00.000Z",
      updatedAt: "2026-04-07T09:50:00.000Z"
    }
  ] as const;
  const baseVivaAttempts = [
    {
      id: "viva_pass",
      sessionId: "session_fixture",
      status: "passed",
      score: 88,
      passingScore: 70,
      completedAt: "2026-04-07T09:54:00.000Z",
      createdAt: "2026-04-07T09:50:00.000Z",
      updatedAt: "2026-04-07T09:54:00.000Z"
    }
  ] as const;
  const aggregate = buildSessionAggregate({
    ...remainingOverrides,
    session: {
      ...baseSession,
      ...(sessionOverrides ?? {})
    },
    artifacts: artifactsOverrides ?? [...baseArtifacts],
    vivaAttempts: vivaAttemptsOverrides ?? [...baseVivaAttempts]
  });

  return createSessionIntegrationHarness(aggregate);
}

describe("hard fail paths integration", () => {
  it.each([
    {
      name: "insufficient valid time",
      overrides: {
        session: { validMinutes: 20 }
      },
      hardFailReason: "insufficient_valid_time",
      criticalCode: "valid_time_insufficient"
    },
    {
      name: "mandatory artifact missing",
      overrides: {
        artifacts: []
      },
      hardFailReason: "mandatory_artifact_missing",
      criticalCode: "mandatory_artifacts_missing"
    },
    {
      name: "missed checkpoints exceeded",
      overrides: {
        session: { missedCheckpointCount: 3 },
        checkpoints: buildCheckpoints(4)
      },
      hardFailReason: "exceeded_missed_checkpoints",
      criticalCode: "checkpoints_exceeded"
    },
    {
      name: "viva below threshold",
      overrides: {
        vivaAttempts: [
          {
            id: "viva_fail",
            sessionId: "session_fixture",
            status: "failed",
            score: 42,
            passingScore: 70,
            completedAt: "2026-04-07T09:54:00.000Z",
            createdAt: "2026-04-07T09:50:00.000Z",
            updatedAt: "2026-04-07T09:54:00.000Z"
          }
        ]
      },
      hardFailReason: "viva_below_threshold",
      criticalCode: "viva_failed"
    },
    {
      name: "critical contract violation without a viva score",
      overrides: {
        vivaAttempts: []
      },
      hardFailReason: "critical_contract_violation",
      criticalCode: "viva_not_attempted"
    }
  ])(
    "fails review for $name through the real M4 -> M3 -> M2 composition",
    async ({ overrides, hardFailReason, criticalCode }) => {
      const harness = createReviewHarness(
        overrides as Parameters<typeof buildSessionAggregate>[0]
      );

      const review = await harness.orchestrator.requestReview(
        harness.state.aggregate.session.id
      );

      expect(review.session.state).toBe("failed");
      expect(review.scoring.outcome).toBe("failed");
      expect(review.scoring.hardFail.reasons).toContain(hardFailReason);
      expect(
        review.contractEvaluation.criticalViolations.map(
          (rule: { code: string }) => rule.code
        )
      ).toContain(criticalCode);
      expect(review.scoring.components.validTime).toBeDefined();
      expect(review.scoring.components.process).toBeDefined();
      expect(typeof review.scoring.sessionScore).toBe("number");
      expect(typeof review.scoring.components.validTime.weighted).toBe("number");
      expect(typeof review.scoring.components.process.weighted).toBe("number");
      expect(harness.state.scoring?.decisionTrace).toBeDefined();
    }
  );
});
