import { AVOIDANCE_PATTERN_DETECTORS } from "./pattern-detectors";
import type {
  AntiAvoidanceInput,
  AntiAvoidanceResult,
  AvoidancePattern,
  AvoidanceRecommendedResponse,
  AvoidanceSeverity
} from "./types";

const SEVERITY_ORDER: Readonly<Record<AvoidanceSeverity, number>> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4
} as const;

function maxSeverity(severities: readonly AvoidanceSeverity[]): AvoidanceSeverity {
  return severities.reduce<AvoidanceSeverity>((currentMax, severity) => {
    return SEVERITY_ORDER[severity] > SEVERITY_ORDER[currentMax] ? severity : currentMax;
  }, "none");
}

function getPatternResponses(
  pattern: AvoidancePattern,
  severity: AvoidanceSeverity
): readonly AvoidanceRecommendedResponse[] {
  switch (severity) {
    case "none":
      return ["no_action"];
    case "low":
      return ["log_only"];
    case "moderate":
      // Explicit raise-warning patterns: non-study exposure, repeated warning cycling,
      // and stalled starts. The remaining current M5 patterns at moderate severity
      // are focus_instability and arming_avoidance, which intentionally map to nudge_user.
      switch (pattern) {
        case "non_study_context":
        case "repeated_warning_cycles":
        case "stalled_session_start":
          return ["raise_warning"];
        default:
          return ["nudge_user"];
      }
    case "high":
      return ["escalate_to_review"];
    case "critical":
      return ["flag_for_admin"];
  }
}

function dedupeResponses(
  responses: readonly AvoidanceRecommendedResponse[]
): readonly AvoidanceRecommendedResponse[] {
  return [...new Set(responses)];
}

export function analyzeAvoidance(input: AntiAvoidanceInput): AntiAvoidanceResult {
  const patterns = AVOIDANCE_PATTERN_DETECTORS.map((detector) => detector(input));
  const detectedPatterns = patterns.filter((pattern) => pattern.detected);
  const overallSeverity =
    detectedPatterns.length === 0
      ? "none"
      : maxSeverity(detectedPatterns.map((pattern) => pattern.severity));
  const hasEscalationSignal = detectedPatterns.some(
    (pattern) => pattern.severity === "high" || pattern.severity === "critical"
  );

  const recommendedResponses =
    detectedPatterns.length === 0
      ? ["no_action" as const]
      : dedupeResponses(
          detectedPatterns.flatMap((pattern) =>
            getPatternResponses(pattern.pattern, pattern.severity)
          )
        );

  return {
    patterns,
    overallSeverity,
    hasEscalationSignal,
    recommendedResponses
  };
}
