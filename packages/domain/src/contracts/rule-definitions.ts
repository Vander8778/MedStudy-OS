import type {
  ContractRuleDefinition,
  ContractRuleEvaluationInput,
  ContractRuleResult
} from "./types";

function evaluateValidTimeRule(
  input: ContractRuleEvaluationInput
): ContractRuleResult {
  if (input.session.validMinutes >= input.contract.minValidMinutes) {
    return {
      code: "valid_time_met",
      passed: true,
      severity: "info",
      message: "Session valid time meets the contract minimum.",
      details: {
        actualValidMinutes: input.session.validMinutes,
        requiredValidMinutes: input.contract.minValidMinutes
      }
    };
  }

  return {
    code: "valid_time_insufficient",
    passed: false,
    severity: "critical",
    message: "Session valid time is below the contract minimum.",
    details: {
      actualValidMinutes: input.session.validMinutes,
      requiredValidMinutes: input.contract.minValidMinutes
    }
  };
}

function evaluateCheckpointRule(
  input: ContractRuleEvaluationInput
): ContractRuleResult {
  if (
    input.session.missedCheckpointCount <= input.contract.maxMissedCheckpoints
  ) {
    return {
      code: "checkpoints_within_limit",
      passed: true,
      severity: "info",
      message: "Missed checkpoints are within the contract limit.",
      details: {
        missedCheckpointCount: input.session.missedCheckpointCount,
        maxMissedCheckpoints: input.contract.maxMissedCheckpoints
      }
    };
  }

  return {
    code: "checkpoints_exceeded",
    passed: false,
    severity: "critical",
    message: "Missed checkpoints exceed the contract limit.",
    details: {
      missedCheckpointCount: input.session.missedCheckpointCount,
      maxMissedCheckpoints: input.contract.maxMissedCheckpoints
    }
  };
}

function evaluateMandatoryArtifactsRule(
  input: ContractRuleEvaluationInput
): ContractRuleResult {
  const submittedArtifactTypes = new Set(input.session.submittedArtifactTypes);
  const missingArtifactTypes = input.contract.mandatoryArtifactTypes.filter(
    (artifactType) => !submittedArtifactTypes.has(artifactType)
  );
  const finalArtifactMissing =
    input.session.finalArtifactRequired &&
    input.signals.mandatoryFinalArtifactMissing;

  if (missingArtifactTypes.length === 0 && !finalArtifactMissing) {
    return {
      code: "mandatory_artifacts_complete",
      passed: true,
      severity: "info",
      message: "All mandatory artifacts required by the contract are present.",
      details: {
        missingArtifactTypes: []
      }
    };
  }

  return {
    code: "mandatory_artifacts_missing",
    passed: false,
    severity: "critical",
    message: "Mandatory artifacts required by the contract are missing.",
    details: {
      missingArtifactTypes,
      mandatoryFinalArtifactMissing: finalArtifactMissing
    }
  };
}

function evaluateVivaRule(
  input: ContractRuleEvaluationInput
): ContractRuleResult {
  if (!input.signals.vivaRequired) {
    return {
      code: "viva_passed",
      passed: true,
      severity: "info",
      message: "Viva is not required by the contract.",
      details: {
        vivaRequired: false
      }
    };
  }

  if (!input.signals.vivaAttempted) {
    return {
      code: "viva_not_attempted",
      passed: false,
      severity: "critical",
      message: "A required viva was not attempted.",
      details: {
        vivaRequired: true,
        vivaAttempted: false
      }
    };
  }

  if (input.signals.vivaScore === undefined) {
    return {
      code: "viva_failed",
      passed: false,
      severity: "critical",
      message: "A required viva was attempted but no score was available.",
      details: {
        vivaRequired: true,
        vivaAttempted: true,
        vivaScoreMissing: true,
        requiredPassingScore: input.contract.vivaPassingScore
      }
    };
  }

  if (input.signals.vivaScore >= input.contract.vivaPassingScore) {
    return {
      code: "viva_passed",
      passed: true,
      severity: "info",
      message: "Viva score meets the contract threshold.",
      details: {
        vivaScore: input.signals.vivaScore,
        requiredPassingScore: input.contract.vivaPassingScore
      }
    };
  }

  return {
    code: "viva_failed",
    passed: false,
    severity: "critical",
    message: "Viva score is below the contract threshold.",
    details: {
      vivaScore: input.signals.vivaScore,
      requiredPassingScore: input.contract.vivaPassingScore
    }
  };
}

function evaluatePauseBudgetRule(
  input: ContractRuleEvaluationInput
): ContractRuleResult {
  if (input.contract.maxPauseMinutes === undefined) {
    return {
      code: "pause_within_limit",
      passed: true,
      severity: "info",
      message: "Pause budget is unlimited for this contract.",
      details: {
        totalPauseMinutes: input.session.totalPauseMinutes
      }
    };
  }

  if (input.session.totalPauseMinutes <= input.contract.maxPauseMinutes) {
    return {
      code: "pause_within_limit",
      passed: true,
      severity: "info",
      message: "Pause usage is within the contract limit.",
      details: {
        totalPauseMinutes: input.session.totalPauseMinutes,
        maxPauseMinutes: input.contract.maxPauseMinutes
      }
    };
  }

  return {
    code: "pause_exceeded",
    passed: false,
    severity: "warning",
    message: "Pause usage exceeds the contract limit.",
    details: {
      totalPauseMinutes: input.session.totalPauseMinutes,
      maxPauseMinutes: input.contract.maxPauseMinutes
    }
  };
}

export const CONTRACT_RULE_DEFINITIONS: readonly ContractRuleDefinition[] = [
  {
    id: "valid_time",
    evaluate: evaluateValidTimeRule
  },
  {
    id: "checkpoints",
    evaluate: evaluateCheckpointRule
  },
  {
    id: "mandatory_artifacts",
    evaluate: evaluateMandatoryArtifactsRule
  },
  {
    id: "viva",
    evaluate: evaluateVivaRule
  },
  {
    id: "pause_budget",
    evaluate: evaluatePauseBudgetRule
  }
] as const;
