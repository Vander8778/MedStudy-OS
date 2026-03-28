import { describe, expect, it } from "vitest";
import { evaluateContractRules, type ContractRuleEvaluationInput } from "..";

function createRuleInput(
  overrides: Partial<ContractRuleEvaluationInput> = {}
): ContractRuleEvaluationInput {
  return {
    contract: {
      minValidMinutes: 90,
      maxMissedCheckpoints: 1,
      mandatoryArtifactTypes: ["summary", "flashcards"],
      vivaPassingScore: 70,
      checkpointIntervalMinutes: 30,
      maxPauseMinutes: 20
    },
    session: {
      validMinutes: 100,
      invalidMinutes: 5,
      plannedDurationMinutes: 120,
      warningCount: 0,
      missedCheckpointCount: 1,
      totalCheckpointCount: 4,
      totalPauseMinutes: 10,
      finalArtifactRequired: true,
      submittedArtifactTypes: ["summary", "flashcards", "final_submission"]
    },
    signals: {
      mandatoryFinalArtifactMissing: false,
      vivaScore: 80,
      vivaRequired: true,
      vivaAttempted: true
    },
    ...overrides
  };
}

function getRuleByCode(
  result: ReturnType<typeof evaluateContractRules>,
  code: string
) {
  return result.rules.find((rule) => rule.code === code);
}

describe("evaluateContractRules", () => {
  it("returns an all-pass happy path", () => {
    const result = evaluateContractRules(createRuleInput());

    expect(result.allRulesPassed).toBe(true);
    expect(result.hasCriticalViolation).toBe(false);
    expect(result.rules.map((rule) => rule.code)).toEqual([
      "valid_time_met",
      "checkpoints_within_limit",
      "mandatory_artifacts_complete",
      "viva_passed",
      "pause_within_limit"
    ]);
    expect(result.criticalViolations).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.informational).toHaveLength(5);
  });

  it("fails when valid time is insufficient", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          validMinutes: 60
        }
      })
    );

    expect(getRuleByCode(result, "valid_time_insufficient")).toMatchObject({
      passed: false,
      severity: "critical"
    });
  });

  it("fails when checkpoints exceed the contract limit", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          missedCheckpointCount: 2
        }
      })
    );

    expect(getRuleByCode(result, "checkpoints_exceeded")).toMatchObject({
      passed: false,
      severity: "critical"
    });
  });

  it("fails when mandatory artifact types are missing", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          submittedArtifactTypes: ["summary", "final_submission"]
        }
      })
    );

    expect(getRuleByCode(result, "mandatory_artifacts_missing")).toMatchObject({
      passed: false,
      severity: "critical"
    });
  });

  it("fails when mandatoryFinalArtifactMissing is true and a final artifact is required", () => {
    const result = evaluateContractRules(
      createRuleInput({
        signals: {
          ...createRuleInput().signals,
          mandatoryFinalArtifactMissing: true
        }
      })
    );

    expect(getRuleByCode(result, "mandatory_artifacts_missing")).toMatchObject({
      passed: false,
      severity: "critical"
    });
  });

  it("does not fail for mandatoryFinalArtifactMissing when finalArtifactRequired is false", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          finalArtifactRequired: false
        },
        signals: {
          ...createRuleInput().signals,
          mandatoryFinalArtifactMissing: true
        }
      })
    );

    expect(getRuleByCode(result, "mandatory_artifacts_complete")).toMatchObject({
      passed: true,
      severity: "info"
    });
  });

  it("passes when viva is required, attempted, and above threshold", () => {
    const result = evaluateContractRules(createRuleInput());

    expect(getRuleByCode(result, "viva_passed")).toMatchObject({
      passed: true,
      severity: "info"
    });
  });

  it("fails when viva is required, attempted, and below threshold", () => {
    const result = evaluateContractRules(
      createRuleInput({
        signals: {
          ...createRuleInput().signals,
          vivaScore: 60
        }
      })
    );

    expect(getRuleByCode(result, "viva_failed")).toMatchObject({
      passed: false,
      severity: "critical"
    });
  });

  it("fails when viva is required but not attempted", () => {
    const result = evaluateContractRules(
      createRuleInput({
        signals: {
          ...createRuleInput().signals,
          vivaAttempted: false,
          vivaScore: undefined
        }
      })
    );

    expect(getRuleByCode(result, "viva_not_attempted")).toMatchObject({
      passed: false,
      severity: "critical"
    });
  });

  it("passes when viva is not required", () => {
    const result = evaluateContractRules(
      createRuleInput({
        signals: {
          ...createRuleInput().signals,
          vivaRequired: false,
          vivaAttempted: false,
          vivaScore: undefined
        }
      })
    );

    expect(getRuleByCode(result, "viva_passed")).toMatchObject({
      passed: true,
      severity: "info",
      details: {
        vivaRequired: false
      }
    });
  });

  it("fails with a warning when pause exceeds the configured limit", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          totalPauseMinutes: 25
        }
      })
    );

    expect(getRuleByCode(result, "pause_exceeded")).toMatchObject({
      passed: false,
      severity: "warning"
    });
  });

  it("passes when pause is unlimited", () => {
    const result = evaluateContractRules(
      createRuleInput({
        contract: {
          ...createRuleInput().contract,
          maxPauseMinutes: undefined
        },
        session: {
          ...createRuleInput().session,
          totalPauseMinutes: 999
        }
      })
    );

    expect(getRuleByCode(result, "pause_within_limit")).toMatchObject({
      passed: true,
      severity: "info"
    });
  });

  it("returns multiple simultaneous violations", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          validMinutes: 40,
          missedCheckpointCount: 3,
          totalPauseMinutes: 25,
          submittedArtifactTypes: []
        },
        signals: {
          mandatoryFinalArtifactMissing: true,
          vivaRequired: true,
          vivaAttempted: true,
          vivaScore: 50
        }
      })
    );

    expect(result.rules.map((rule) => rule.code)).toEqual([
      "valid_time_insufficient",
      "checkpoints_exceeded",
      "mandatory_artifacts_missing",
      "viva_failed",
      "pause_exceeded"
    ]);
  });

  it("sets hasCriticalViolation to true when critical failures exist", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          validMinutes: 40
        }
      })
    );

    expect(result.hasCriticalViolation).toBe(true);
  });

  it("keeps hasCriticalViolation false when only a warning exists", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          totalPauseMinutes: 25
        }
      })
    );

    expect(result.hasCriticalViolation).toBe(false);
    expect(result.allRulesPassed).toBe(false);
  });

  it("segments critical, warning, and informational results correctly", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          submittedArtifactTypes: ["summary"],
          totalPauseMinutes: 25
        }
      })
    );

    expect(result.criticalViolations.map((rule) => rule.code)).toEqual([
      "mandatory_artifacts_missing"
    ]);
    expect(result.warnings.map((rule) => rule.code)).toEqual(["pause_exceeded"]);
    expect(result.informational.map((rule) => rule.code)).toEqual([
      "valid_time_met",
      "checkpoints_within_limit",
      "viva_passed"
    ]);
  });

  it("includes missing artifact types in failure details", () => {
    const result = evaluateContractRules(
      createRuleInput({
        session: {
          ...createRuleInput().session,
          submittedArtifactTypes: ["final_submission"]
        }
      })
    );

    expect(getRuleByCode(result, "mandatory_artifacts_missing")).toMatchObject({
      details: {
        missingArtifactTypes: ["summary", "flashcards"],
        mandatoryFinalArtifactMissing: false
      }
    });
  });

  it("treats a required viva with a missing score as a deterministic failure", () => {
    const result = evaluateContractRules(
      createRuleInput({
        signals: {
          ...createRuleInput().signals,
          vivaScore: undefined
        }
      })
    );

    expect(getRuleByCode(result, "viva_failed")).toMatchObject({
      passed: false,
      severity: "critical",
      details: {
        vivaScoreMissing: true,
        requiredPassingScore: 70
      }
    });
  });
});
