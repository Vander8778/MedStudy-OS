import { describe, expect, it } from "vitest";
import { evaluateHardFailConditions, type ScoringInput } from "..";

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
      processScore: 80,
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

describe("evaluateHardFailConditions", () => {
  it("flags insufficient valid time", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          validMinutes: 30
        }
      })
    );

    expect(result).toEqual({
      triggered: true,
      reasons: ["insufficient_valid_time"]
    });
  });

  it("does not fail when validMinutes equals the threshold", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          validMinutes: 60
        }
      })
    );

    expect(result.reasons).not.toContain("insufficient_valid_time");
  });

  it("fails when validMinutes is just below the threshold", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          validMinutes: 59
        }
      })
    );

    expect(result.reasons).toContain("insufficient_valid_time");
  });

  it("flags missing mandatory artifact", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        hardFailSignals: {
          mandatoryFinalArtifactMissing: true,
          criticalContractViolation: false
        }
      })
    );

    expect(result.reasons).toEqual(["mandatory_artifact_missing"]);
  });

  it("does not fail for a missing final artifact when no final artifact is required", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          finalArtifactRequired: false
        },
        hardFailSignals: {
          mandatoryFinalArtifactMissing: true,
          criticalContractViolation: false
        }
      })
    );

    expect(result.reasons).not.toContain("mandatory_artifact_missing");
  });

  it("flags exceeded missed checkpoints", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          missedCheckpointCount: 2
        }
      })
    );

    expect(result.reasons).toEqual(["exceeded_missed_checkpoints"]);
  });

  it("does not fail when missedCheckpointCount equals the threshold", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          missedCheckpointCount: 1
        }
      })
    );

    expect(result.reasons).not.toContain("exceeded_missed_checkpoints");
  });

  it("flags viva below threshold", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        hardFailSignals: {
          mandatoryFinalArtifactMissing: false,
          criticalContractViolation: false,
          vivaScore: 60
        }
      })
    );

    expect(result.reasons).toEqual(["viva_below_threshold"]);
  });

  it("does not fail when vivaScore equals the threshold", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        hardFailSignals: {
          mandatoryFinalArtifactMissing: false,
          criticalContractViolation: false,
          vivaScore: 70
        }
      })
    );

    expect(result.reasons).not.toContain("viva_below_threshold");
  });

  it("flags critical contract violation", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        hardFailSignals: {
          mandatoryFinalArtifactMissing: false,
          criticalContractViolation: true
        }
      })
    );

    expect(result.reasons).toEqual(["critical_contract_violation"]);
  });

  it("returns all simultaneous hard-fail reasons without short-circuiting", () => {
    const result = evaluateHardFailConditions(
      createScoringInput({
        session: {
          ...createScoringInput().session,
          validMinutes: 20,
          missedCheckpointCount: 3
        },
        hardFailSignals: {
          mandatoryFinalArtifactMissing: true,
          criticalContractViolation: true,
          vivaScore: 50
        }
      })
    );

    expect(result).toEqual({
      triggered: true,
      reasons: [
        "insufficient_valid_time",
        "mandatory_artifact_missing",
        "exceeded_missed_checkpoints",
        "viva_below_threshold",
        "critical_contract_violation"
      ]
    });
  });

  it("does not fail when vivaScore is undefined", () => {
    const result = evaluateHardFailConditions(createScoringInput());

    expect(result.reasons).not.toContain("viva_below_threshold");
  });

  it("returns a no-hard-fail path when nothing is triggered", () => {
    const result = evaluateHardFailConditions(createScoringInput());

    expect(result).toEqual({
      triggered: false,
      reasons: []
    });
  });
});
