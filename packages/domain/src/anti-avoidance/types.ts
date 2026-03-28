import type { SessionState } from "@medstudy/contracts";

export type AvoidanceThresholds = {
  idleStretchWarningMinutes: number;
  idleStretchCriticalMinutes: number;
  idleTotalWarningMinutes: number;
  contextSwitchWarningCount: number;
  contextSwitchCriticalCount: number;
  nonStudyContextWarningMinutes: number;
  nonStudyContextCriticalMinutes: number;
  warningCycleEscalationCount: number;
  armingCancelEscalationCount: number;
  stalledStartMinutes: number;
};

export type AntiAvoidanceInput = {
  session: {
    state: SessionState;
    plannedDurationMinutes: number;
    elapsedMinutes: number;
    validMinutes: number;
    invalidMinutes: number;
    warningCount: number;
    missedCheckpointCount: number;
    currentWarningActive: boolean;
    currentWarningDurationMinutes?: number;
  };
  behavior: {
    idleMinutes: number;
    longestIdleStretchMinutes: number;
    contextSwitchCount: number;
    nonStudyContextMinutes: number;
    nonStudyContextDetected: boolean;
    inputActivityLevel: "none" | "minimal" | "normal";
  };
  history: {
    warningRecoveryCount: number;
    warningEscalationCount: number;
    armingAttemptCount: number;
    armingCancelCount: number;
    previousSessionAvoidanceCount: number;
  };
  thresholds: AvoidanceThresholds;
};

export type AvoidancePattern =
  | "prolonged_idle"
  | "non_study_context"
  | "focus_instability"
  | "repeated_warning_cycles"
  | "stalled_session_start"
  | "arming_avoidance"
  | "active_warning_escalation";

export type AvoidanceSeverity = "none" | "low" | "moderate" | "high" | "critical";

export type AvoidanceRecommendedResponse =
  | "no_action"
  | "log_only"
  | "nudge_user"
  | "raise_warning"
  | "escalate_to_review"
  | "flag_for_admin";

export type AvoidancePatternResult = {
  pattern: AvoidancePattern;
  detected: boolean;
  severity: AvoidanceSeverity;
  message: string;
  details?: Record<string, unknown>;
};

export type AntiAvoidanceResult = {
  patterns: readonly AvoidancePatternResult[];
  overallSeverity: AvoidanceSeverity;
  hasEscalationSignal: boolean;
  recommendedResponses: readonly AvoidanceRecommendedResponse[];
};
