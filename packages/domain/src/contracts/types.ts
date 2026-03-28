export type ContractValidationInput = {
  terms: {
    minValidMinutes: number;
    maxMissedCheckpoints: number;
    mandatoryArtifactTypes: readonly string[];
    vivaPassingScore: number;
    checkpointIntervalMinutes?: number;
    maxPauseMinutes?: number;
  };
  activeRange: {
    startsAt: string;
    endsAt: string;
  };
};

export type ContractValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type ContractValidationResult =
  | { valid: true }
  | { valid: false; issues: readonly ContractValidationIssue[] };

export type ContractRuleEvaluationInput = {
  contract: {
    minValidMinutes: number;
    maxMissedCheckpoints: number;
    mandatoryArtifactTypes: readonly string[];
    vivaPassingScore: number;
    checkpointIntervalMinutes?: number;
    maxPauseMinutes?: number;
  };
  session: {
    validMinutes: number;
    invalidMinutes: number;
    plannedDurationMinutes: number;
    warningCount: number;
    missedCheckpointCount: number;
    totalCheckpointCount: number;
    totalPauseMinutes: number;
    finalArtifactRequired: boolean;
    submittedArtifactTypes: readonly string[];
  };
  signals: {
    mandatoryFinalArtifactMissing: boolean;
    vivaScore?: number;
    vivaRequired: boolean;
    vivaAttempted: boolean;
  };
};

export type ContractRuleCode =
  | "valid_time_met"
  | "valid_time_insufficient"
  | "checkpoints_within_limit"
  | "checkpoints_exceeded"
  | "mandatory_artifacts_complete"
  | "mandatory_artifacts_missing"
  | "viva_passed"
  | "viva_failed"
  | "viva_not_attempted"
  | "pause_within_limit"
  | "pause_exceeded";

export type ViolationSeverity = "info" | "warning" | "critical";

export type ContractRuleResult = {
  code: ContractRuleCode;
  passed: boolean;
  severity: ViolationSeverity;
  message: string;
  details?: Record<string, unknown>;
};

export type ContractEvaluationResult = {
  allRulesPassed: boolean;
  hasCriticalViolation: boolean;
  rules: readonly ContractRuleResult[];
  criticalViolations: readonly ContractRuleResult[];
  warnings: readonly ContractRuleResult[];
  informational: readonly ContractRuleResult[];
};

export type ContractRuleDefinition = {
  id:
    | "valid_time"
    | "checkpoints"
    | "mandatory_artifacts"
    | "viva"
    | "pause_budget";
  evaluate: (input: ContractRuleEvaluationInput) => ContractRuleResult;
};
