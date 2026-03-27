import { describe, expect, it } from "vitest";
import { scoreSession, type ScoringInput } from "..";

function createScoringInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    contract: {
      minValidMinutes: 60,
      maxMissedCheckpoints: 1,
      mandatoryArtifactTypes: ["final_submission"],
      vivaPassingScore: 70
    },
    session: {
      validMinutes: 90,
      invalidMinutes: 0,
      plannedDurationMinutes: 120,
      warningCount: 0,
      missedCheckpointCount: 0,
      totalCheckpointCount: 3,
      finalArtifactRequired: true
    },
    components: {
      validTimeScore: 90,
      processScore: 90,
      artifactScore: 85,
      knowledgeScore: 88
    },
    hardFailSignals: {
      mandatoryFinalArtifactMissing: false,
      criticalContractViolation: false
    },
    ...overrides
  };
}

describe("scoreSession", () => {
  it("returns a completed result on a completed happy path", () => {
    const result = scoreSession(createScoringInput());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.outcome).toBe("completed");
      expect(result.result.sessionScore).toBe(88.35);
      expect(result.result.decisionTrace).toEqual({
        decidedByHardFail: false,
        scoreThresholdApplied: {
          min: 85,
          max: 100,
          outcome: "completed"
        }
      });
    }
  });

  it("returns a partial result on a partial happy path", () => {
    const result = scoreSession(
      createScoringInput({
        components: {
          validTimeScore: 70,
          processScore: 70,
          artifactScore: 65,
          knowledgeScore: 70
        }
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.outcome).toBe("partial");
      expect(result.result.sessionScore).toBe(68.75);
    }
  });

  it("returns failed by low weighted score", () => {
    const result = scoreSession(
      createScoringInput({
        components: {
          validTimeScore: 50,
          processScore: 50,
          artifactScore: 50,
          knowledgeScore: 50
        }
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.outcome).toBe("failed");
      expect(result.result.sessionScore).toBe(50);
      expect(result.result.hardFail.triggered).toBe(false);
    }
  });

  it("returns failed by hard fail despite a high weighted score", () => {
    const result = scoreSession(
      createScoringInput({
        hardFailSignals: {
          mandatoryFinalArtifactMissing: false,
          criticalContractViolation: true
        }
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.outcome).toBe("failed");
      expect(result.result.sessionScore).toBe(88.35);
      expect(result.result.hardFail).toEqual({
        triggered: true,
        reasons: ["critical_contract_violation"]
      });
      expect(result.result.decisionTrace).toEqual({
        decidedByHardFail: true
      });
    }
  });

  it("rejects invalid input", () => {
    const result = scoreSession(
      createScoringInput({
        components: {
          validTimeScore: 105
        }
      })
    );

    expect(result).toEqual({
      ok: false,
      code: "INVALID_INPUT",
      reason: "components.validTimeScore must be within 0..100 when provided."
    });
  });

  it("returns the expected explainable result shape", () => {
    const result = scoreSession(createScoringInput());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result).toMatchObject({
        outcome: "completed",
        sessionScore: 88.35,
        hardFail: {
          triggered: false,
          reasons: []
        },
        decisionTrace: {
          decidedByHardFail: false
        }
      });
      expect(result.result.components.validTime).toHaveProperty("raw");
      expect(result.result.components.validTime).toHaveProperty("weight");
      expect(result.result.components.validTime).toHaveProperty("weighted");
    }
  });

  it("still returns a score when hard fail is triggered", () => {
    const result = scoreSession(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          validMinutes: 10
        },
        hardFailSignals: {
          mandatoryFinalArtifactMissing: true,
          criticalContractViolation: false,
          vivaScore: 50
        }
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.sessionScore).toBe(88.35);
      expect(result.result.hardFail.reasons).toEqual([
        "insufficient_valid_time",
        "mandatory_artifact_missing",
        "viva_below_threshold"
      ]);
      expect(result.result.outcome).toBe("failed");
    }
  });
});
