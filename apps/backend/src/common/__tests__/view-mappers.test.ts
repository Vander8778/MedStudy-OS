import { describe, expect, it } from "vitest";
import {
  mapReviewResultResponse,
  mapSessionAggregateResponse
} from "../view-mappers";

function createAggregate() {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Mapped session",
      objective: "Verify mapping",
      state: "active_valid",
      plannedRange: {
        startsAt: "2026-03-29T09:00:00.000Z",
        endsAt: "2026-03-29T11:00:00.000Z"
      },
      validMinutes: 30,
      invalidMinutes: 0,
      warningCount: 1,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      blockIds: ["block_1"],
      checkpointIds: ["checkpoint_1"],
      artifactIds: ["artifact_1"],
      evaluationIds: ["evaluation_1"],
      vivaAttemptIds: ["viva_1"],
      penaltyIds: ["penalty_1"],
      metadata: { hidden: true },
      createdAt: "2026-03-29T08:55:00.000Z",
      updatedAt: "2026-03-29T09:05:00.000Z"
    },
    contract: {
      id: "contract_1",
      userId: "user_1",
      name: "Core contract",
      description: "Contract description",
      status: "active",
      terms: {
        minValidMinutes: 60,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70,
        checkpointIntervalMinutes: 30,
        maxPauseMinutes: 10
      },
      activeRange: {
        startsAt: "2026-03-29T09:00:00.000Z",
        endsAt: "2026-03-29T11:00:00.000Z"
      },
      tags: ["focus"],
      metadata: { hidden: true },
      createdAt: "2026-03-29T08:00:00.000Z",
      updatedAt: "2026-03-29T08:00:00.000Z"
    },
    checkpoints: [
      {
        id: "checkpoint_1",
        sessionId: "session_1",
        order: 1,
        title: "Checkpoint 1",
        status: "pending",
        dueAt: "2026-03-29T09:30:00.000Z",
        createdAt: "2026-03-29T08:55:00.000Z",
        updatedAt: "2026-03-29T08:55:00.000Z"
      }
    ],
    artifacts: [
      {
        id: "artifact_1",
        sessionId: "session_1",
        type: "final_submission",
        source: "user_upload",
        status: "submitted",
        title: "Final artifact",
        isMandatory: true,
        createdAt: "2026-03-29T09:10:00.000Z",
        updatedAt: "2026-03-29T09:10:00.000Z"
      }
    ],
    vivaAttempts: [],
    blocks: [
      {
        id: "block_1",
        sessionId: "session_1",
        type: "study",
        range: {
          startsAt: "2026-03-29T09:00:00.000Z",
          endsAt: "2026-03-29T09:30:00.000Z"
        },
        creditedMinutes: 30,
        createdAt: "2026-03-29T09:00:00.000Z",
        updatedAt: "2026-03-29T09:30:00.000Z"
      }
    ],
    penalties: [],
    events: []
  };
}

describe("view mappers", () => {
  it("does not leak internal session or contract fields in aggregate mapping", () => {
    const result = mapSessionAggregateResponse(createAggregate() as never);

    expect("blockIds" in result.session).toBe(false);
    expect("artifactIds" in result.session).toBe(false);
    expect("metadata" in result.session).toBe(false);
    expect("metadata" in result.contract).toBe(false);
  });

  it("preserves ISO datetime strings in mapped views", () => {
    const result = mapSessionAggregateResponse(createAggregate() as never);

    expect(result.session.plannedRange.startsAt).toBe("2026-03-29T09:00:00.000Z");
    expect(result.checkpoints[0].dueAt).toBe("2026-03-29T09:30:00.000Z");
    expect(result.blocks[0].range.endsAt).toBe("2026-03-29T09:30:00.000Z");
  });

  it("maps review results into the enriched response shape", () => {
    const aggregate = createAggregate();
    const result = mapReviewResultResponse({
      session: aggregate.session as never,
      scoring: {
        outcome: "completed",
        sessionScore: 91,
        components: {
          validTime: { raw: 100, weight: 0.35, weighted: 35 },
          process: { raw: 90, weight: 0.2, weighted: 18 },
          artifact: { raw: 100, weight: 0.25, weighted: 25 },
          knowledge: { raw: 65, weight: 0.2, weighted: 13 }
        },
        hardFail: { triggered: false, reasons: [] },
        decisionTrace: { decidedByHardFail: false }
      } as never,
      contractEvaluation: {
        allRulesPassed: false,
        hasCriticalViolation: true,
        rules: [],
        criticalViolations: [{ code: "pause_exceeded" }],
        warnings: [{ code: "viva_failed" }],
        informational: [{ code: "valid_time_met" }]
      } as never
    });

    expect(result.session.state).toBe("active_valid");
    expect(result.scoring.components.validTime.weighted).toBe(35);
    expect(result.contractEvaluation.criticalViolationCodes).toEqual(["pause_exceeded"]);
    expect(result.contractEvaluation.warningCodes).toEqual(["viva_failed"]);
    expect(result.contractEvaluation.informationalCodes).toEqual(["valid_time_met"]);
  });
});
