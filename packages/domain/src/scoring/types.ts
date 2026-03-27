export type SessionOutcome = "completed" | "partial" | "failed";

export type HardFailReason =
  | "insufficient_valid_time"
  | "mandatory_artifact_missing"
  | "exceeded_missed_checkpoints"
  | "viva_below_threshold"
  | "critical_contract_violation";

export type ComponentScoreBreakdown = {
  raw: number | null;
  weight: number;
  weighted: number;
};

export type ScoringInput = {
  contract: {
    minValidMinutes: number;
    maxMissedCheckpoints: number;
    mandatoryArtifactTypes: readonly string[];
    vivaPassingScore: number;
  };
  session: {
    validMinutes: number;
    invalidMinutes: number;
    plannedDurationMinutes: number;
    warningCount: number;
    missedCheckpointCount: number;
    totalCheckpointCount: number;
    finalArtifactRequired: boolean;
  };
  components: {
    validTimeScore?: number;
    processScore?: number;
    artifactScore?: number;
    knowledgeScore?: number;
  };
  hardFailSignals: {
    mandatoryFinalArtifactMissing: boolean;
    criticalContractViolation: boolean;
    vivaScore?: number;
  };
};

export type ScoringComponentsBreakdown = {
  validTime: ComponentScoreBreakdown;
  process: ComponentScoreBreakdown;
  artifact: ComponentScoreBreakdown;
  knowledge: ComponentScoreBreakdown;
};

export type HardFailEvaluation = {
  triggered: boolean;
  reasons: readonly HardFailReason[];
};

export type WeightedScoringResult = {
  sessionScore: number;
  components: ScoringComponentsBreakdown;
};

export type DecisionTrace = {
  decidedByHardFail: boolean;
  scoreThresholdApplied?: {
    min: number;
    max: number;
    outcome: SessionOutcome;
  };
};

export type DecisionResolution = {
  outcome: SessionOutcome;
  decisionTrace: DecisionTrace;
};

export type ScoringResult = {
  outcome: SessionOutcome;
  sessionScore: number;
  components: ScoringComponentsBreakdown;
  hardFail: HardFailEvaluation;
  decisionTrace: DecisionTrace;
};

export type ScoreSessionResult =
  | { ok: true; result: ScoringResult }
  | { ok: false; code: "INVALID_INPUT"; reason: string };

export type ScoringComponentName = keyof ScoringComponentsBreakdown;
export type ScoringComponentInputKey = keyof ScoringInput["components"];
