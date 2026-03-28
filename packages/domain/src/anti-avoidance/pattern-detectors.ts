import type {
  AntiAvoidanceInput,
  AvoidancePatternResult,
  AvoidanceSeverity
} from "./types";

const STALLED_START_STATES = new Set([
  "arming",
  "armed",
  "active_valid",
  "active_warning",
  "paused_valid",
  "paused_expired",
  "invalid_block"
]);

function buildUndetectedResult(
  pattern: AvoidancePatternResult["pattern"],
  message: string,
  details?: Record<string, unknown>
): AvoidancePatternResult {
  return {
    pattern,
    detected: false,
    severity: "none",
    message,
    details
  };
}

function buildDetectedResult(
  pattern: AvoidancePatternResult["pattern"],
  severity: Exclude<AvoidanceSeverity, "none">,
  message: string,
  details?: Record<string, unknown>
): AvoidancePatternResult {
  return {
    pattern,
    detected: true,
    severity,
    message,
    details
  };
}

export function detectProlongedIdle(
  input: AntiAvoidanceInput
): AvoidancePatternResult {
  const { longestIdleStretchMinutes, idleMinutes, inputActivityLevel } = input.behavior;
  const { idleStretchWarningMinutes, idleStretchCriticalMinutes } = input.thresholds;

  if (longestIdleStretchMinutes >= idleStretchCriticalMinutes) {
    return buildDetectedResult(
      "prolonged_idle",
      "critical",
      "Idle stretch exceeds the critical avoidance threshold.",
      {
        longestIdleStretchMinutes,
        idleStretchWarningMinutes,
        idleStretchCriticalMinutes,
        idleMinutes,
        inputActivityLevel
      }
    );
  }

  if (longestIdleStretchMinutes >= idleStretchWarningMinutes) {
    return buildDetectedResult(
      "prolonged_idle",
      "moderate",
      "Idle stretch exceeds the warning avoidance threshold.",
      {
        longestIdleStretchMinutes,
        idleStretchWarningMinutes,
        idleMinutes,
        inputActivityLevel
      }
    );
  }

  if ((inputActivityLevel === "minimal" || inputActivityLevel === "none") && idleMinutes > 0) {
    return buildDetectedResult(
      "prolonged_idle",
      "low",
      "Low-input idle behavior is present.",
      {
        idleMinutes,
        longestIdleStretchMinutes,
        inputActivityLevel
      }
    );
  }

  return buildUndetectedResult("prolonged_idle", "No prolonged idle pattern detected.", {
    idleMinutes,
    longestIdleStretchMinutes,
    inputActivityLevel
  });
}

export function detectNonStudyContext(
  input: AntiAvoidanceInput
): AvoidancePatternResult {
  const { nonStudyContextDetected, nonStudyContextMinutes } = input.behavior;
  const {
    nonStudyContextWarningMinutes,
    nonStudyContextCriticalMinutes
  } = input.thresholds;

  if (!nonStudyContextDetected) {
    return buildUndetectedResult(
      "non_study_context",
      "No non-study context exposure detected.",
      {
        nonStudyContextDetected,
        nonStudyContextMinutes
      }
    );
  }

  if (nonStudyContextMinutes >= nonStudyContextCriticalMinutes) {
    return buildDetectedResult(
      "non_study_context",
      "critical",
      "Non-study context exposure exceeds the critical threshold.",
      {
        nonStudyContextMinutes,
        nonStudyContextWarningMinutes,
        nonStudyContextCriticalMinutes
      }
    );
  }

  if (nonStudyContextMinutes >= nonStudyContextWarningMinutes) {
    return buildDetectedResult(
      "non_study_context",
      "moderate",
      "Non-study context exposure exceeds the warning threshold.",
      {
        nonStudyContextMinutes,
        nonStudyContextWarningMinutes
      }
    );
  }

  return buildDetectedResult(
    "non_study_context",
    "low",
    "Brief non-study context exposure was detected.",
    {
      nonStudyContextMinutes
    }
  );
}

export function detectFocusInstability(
  input: AntiAvoidanceInput
): AvoidancePatternResult {
  const { contextSwitchCount } = input.behavior;
  const { contextSwitchWarningCount, contextSwitchCriticalCount } = input.thresholds;

  // MVP choice: critical-threshold switching is treated as high rather than critical.
  // We reserve critical for stronger direct evidence such as prolonged idle and non-study exposure.
  if (contextSwitchCount >= contextSwitchCriticalCount) {
    return buildDetectedResult(
      "focus_instability",
      "high",
      "Context switching exceeds the critical instability threshold.",
      {
        contextSwitchCount,
        contextSwitchWarningCount,
        contextSwitchCriticalCount
      }
    );
  }

  if (contextSwitchCount >= contextSwitchWarningCount) {
    return buildDetectedResult(
      "focus_instability",
      "moderate",
      "Context switching exceeds the warning instability threshold.",
      {
        contextSwitchCount,
        contextSwitchWarningCount
      }
    );
  }

  if (contextSwitchCount > 0) {
    return buildDetectedResult(
      "focus_instability",
      "low",
      "Some focus instability is present.",
      {
        contextSwitchCount
      }
    );
  }

  return buildUndetectedResult("focus_instability", "No focus instability detected.", {
    contextSwitchCount
  });
}

export function detectRepeatedWarningCycles(
  input: AntiAvoidanceInput
): AvoidancePatternResult {
  const { warningRecoveryCount, warningEscalationCount } = input.history;
  const { warningCount } = input.session;
  const { warningCycleEscalationCount } = input.thresholds;
  const repeatedCycleLoad = warningRecoveryCount + warningEscalationCount;

  if (
    warningEscalationCount >= warningCycleEscalationCount ||
    // warningCount uses a +1 offset so we only mark the pattern as high once the raw
    // warning count has clearly moved beyond the configured cycle threshold, rather
    // than merely touching it without an observed escalation event.
    warningCount >= warningCycleEscalationCount + 1
  ) {
    return buildDetectedResult(
      "repeated_warning_cycles",
      "high",
      "Repeated warning cycling indicates likely avoidance behavior.",
      {
        warningCount,
        warningRecoveryCount,
        warningEscalationCount,
        warningCycleEscalationCount,
        repeatedCycleLoad
      }
    );
  }

  if (repeatedCycleLoad >= 2 || warningCount >= 2) {
    return buildDetectedResult(
      "repeated_warning_cycles",
      "moderate",
      "Repeated warning/recovery activity is present.",
      {
        warningCount,
        warningRecoveryCount,
        warningEscalationCount,
        repeatedCycleLoad
      }
    );
  }

  if (warningCount > 0 || repeatedCycleLoad > 0) {
    return buildDetectedResult(
      "repeated_warning_cycles",
      "low",
      "Early warning-cycle repetition is present.",
      {
        warningCount,
        warningRecoveryCount,
        warningEscalationCount,
        repeatedCycleLoad
      }
    );
  }

  return buildUndetectedResult(
    "repeated_warning_cycles",
    "No repeated warning-cycle pattern detected.",
    {
      warningCount,
      warningRecoveryCount,
      warningEscalationCount
    }
  );
}

export function detectStalledSessionStart(
  input: AntiAvoidanceInput
): AvoidancePatternResult {
  const { state, elapsedMinutes, validMinutes } = input.session;
  const { stalledStartMinutes } = input.thresholds;

  if (state === "planned") {
    return buildUndetectedResult(
      "stalled_session_start",
      "Planned sessions are not evaluated for stalled starts.",
      {
        state,
        elapsedMinutes,
        validMinutes
      }
    );
  }

  if (!STALLED_START_STATES.has(state)) {
    return buildUndetectedResult(
      "stalled_session_start",
      "Current session state is outside stalled-start evaluation.",
      {
        state,
        elapsedMinutes,
        validMinutes
      }
    );
  }

  if (validMinutes > 0 || elapsedMinutes <= stalledStartMinutes) {
    return buildUndetectedResult(
      "stalled_session_start",
      "No stalled session start pattern detected.",
      {
        state,
        elapsedMinutes,
        validMinutes,
        stalledStartMinutes
      }
    );
  }

  if (elapsedMinutes >= stalledStartMinutes * 2) {
    return buildDetectedResult(
      "stalled_session_start",
      "high",
      "Session start is significantly stalled with no valid study time recorded.",
      {
        state,
        elapsedMinutes,
        validMinutes,
        stalledStartMinutes
      }
    );
  }

  return buildDetectedResult(
    "stalled_session_start",
    "moderate",
    "Session start is stalled with no valid study time recorded.",
    {
      state,
      elapsedMinutes,
      validMinutes,
      stalledStartMinutes
    }
  );
}

export function detectArmingAvoidance(
  input: AntiAvoidanceInput
): AvoidancePatternResult {
  const { armingAttemptCount, armingCancelCount } = input.history;
  const { armingCancelEscalationCount } = input.thresholds;

  // The high-severity branch is intentionally threshold-driven so callers can tune escalation.
  // If armingCancelEscalationCount is configured at 2 or below, the moderate branch becomes
  // unreachable by design because that configuration explicitly promotes earlier escalation.
  if (armingCancelCount >= armingCancelEscalationCount) {
    return buildDetectedResult(
      "arming_avoidance",
      "high",
      "Repeated arming cancels indicate avoidance before session start.",
      {
        armingAttemptCount,
        armingCancelCount,
        armingCancelEscalationCount
      }
    );
  }

  if (armingCancelCount >= 2) {
    return buildDetectedResult(
      "arming_avoidance",
      "moderate",
      "Repeated arming cancels are present.",
      {
        armingAttemptCount,
        armingCancelCount,
        armingCancelEscalationCount
      }
    );
  }

  if (armingCancelCount > 0) {
    return buildDetectedResult(
      "arming_avoidance",
      "low",
      "An arming cancel pattern is present.",
      {
        armingAttemptCount,
        armingCancelCount
      }
    );
  }

  return buildUndetectedResult("arming_avoidance", "No arming avoidance detected.", {
    armingAttemptCount,
    armingCancelCount
  });
}

export function detectActiveWarningEscalation(
  input: AntiAvoidanceInput
): AvoidancePatternResult {
  const { currentWarningActive, currentWarningDurationMinutes = 0 } = input.session;
  const { idleStretchWarningMinutes, idleStretchCriticalMinutes } = input.thresholds;

  if (!currentWarningActive) {
    return buildUndetectedResult(
      "active_warning_escalation",
      "No active warning escalation is present.",
      {
        currentWarningActive,
        currentWarningDurationMinutes
      }
    );
  }

  // MVP choice: unresolved warning duration reuses the idle-stretch thresholds.
  // This keeps M5 thresholding compact until warning-specific duration thresholds are introduced.
  if (currentWarningDurationMinutes >= idleStretchCriticalMinutes) {
    return buildDetectedResult(
      "active_warning_escalation",
      "critical",
      "Active warning duration exceeds the critical escalation threshold.",
      {
        currentWarningDurationMinutes,
        idleStretchWarningMinutes,
        idleStretchCriticalMinutes
      }
    );
  }

  if (currentWarningDurationMinutes >= idleStretchWarningMinutes) {
    return buildDetectedResult(
      "active_warning_escalation",
      "high",
      "Active warning duration exceeds the warning escalation threshold.",
      {
        currentWarningDurationMinutes,
        idleStretchWarningMinutes
      }
    );
  }

  return buildUndetectedResult(
    "active_warning_escalation",
    "Active warning has not yet reached escalation duration.",
    {
      currentWarningActive,
      currentWarningDurationMinutes,
      idleStretchWarningMinutes
    }
  );
}

export const AVOIDANCE_PATTERN_DETECTORS = [
  detectProlongedIdle,
  detectNonStudyContext,
  detectFocusInstability,
  detectRepeatedWarningCycles,
  detectStalledSessionStart,
  detectArmingAvoidance,
  detectActiveWarningEscalation
] as const;
