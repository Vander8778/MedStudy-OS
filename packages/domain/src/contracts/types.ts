export type ContractValidationInput = {
  terms: {
    minValidMinutes: number;
    maxMissedCheckpoints: number;
    // Artifact-type membership is enforced upstream by the shared contracts/schema layer.
    // M4 validates contract-rule semantics on already-shaped inputs and only checks for
    // issues that remain meaningful at this layer, such as accidental empty strings.
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
    // This mirrors the orchestrator-assembled hard-fail signal consumed by M3.
    // The duplication is intentional: the orchestrator computes this signal once,
    // then passes the same semantic fact into both M3 and M4 so each pure module
    // can evaluate its own responsibilities without importing the other.
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
