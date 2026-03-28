import { describe, expect, it } from "vitest";
import { analyzeAvoidance, type AntiAvoidanceInput } from "..";

function createInput(
  overrides: Partial<AntiAvoidanceInput> = {}
): AntiAvoidanceInput {
  return {
    session: {
      state: "active_valid",
      plannedDurationMinutes: 120,
      elapsedMinutes: 30,
      validMinutes: 20,
      invalidMinutes: 0,
      warningCount: 0,
      missedCheckpointCount: 0,
      currentWarningActive: false
    },
    behavior: {
      idleMinutes: 0,
      longestIdleStretchMinutes: 0,
      contextSwitchCount: 0,
      nonStudyContextMinutes: 0,
      nonStudyContextDetected: false,
      inputActivityLevel: "normal"
    },
    history: {
      warningRecoveryCount: 0,
      warningEscalationCount: 0,
      armingAttemptCount: 1,
      armingCancelCount: 0,
      previousSessionAvoidanceCount: 0
    },
    thresholds: {
      idleStretchWarningMinutes: 5,
      idleStretchCriticalMinutes: 15,
      idleTotalWarningMinutes: 10,
      contextSwitchWarningCount: 4,
      contextSwitchCriticalCount: 8,
      nonStudyContextWarningMinutes: 3,
      nonStudyContextCriticalMinutes: 10,
      warningCycleEscalationCount: 3,
      armingCancelEscalationCount: 3,
      stalledStartMinutes: 10
    },
    ...overrides
  };
}

describe("analyzeAvoidance", () => {
  it("returns none severity, no escalation, and no_action when no signals exist", () => {
    const result = analyzeAvoidance(createInput());

    expect(result.overallSeverity).toBe("none");
    expect(result.hasEscalationSignal).toBe(false);
    expect(result.recommendedResponses).toEqual(["no_action"]);
  });

  it("returns a low-severity result for a single low signal", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          idleMinutes: 2,
          inputActivityLevel: "none"
        }
      })
    );

    expect(result.overallSeverity).toBe("low");
    expect(result.hasEscalationSignal).toBe(false);
    expect(result.recommendedResponses).toEqual(["log_only"]);
  });

  it("returns a moderate-severity result for a single moderate signal", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          contextSwitchCount: 4
        }
      })
    );

    expect(result.overallSeverity).toBe("moderate");
    expect(result.hasEscalationSignal).toBe(false);
    expect(result.recommendedResponses).toEqual(["nudge_user"]);
  });

  it("keeps moderate prolonged idle on the nudge_user path", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          longestIdleStretchMinutes: 5
        }
      })
    );

    expect(result.overallSeverity).toBe("moderate");
    expect(result.hasEscalationSignal).toBe(false);
    expect(result.recommendedResponses).toEqual(["nudge_user"]);
  });

  it("returns raise_warning for a moderate pattern that maps to warning escalation", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          nonStudyContextDetected: true,
          nonStudyContextMinutes: 3
        }
      })
    );

    expect(result.overallSeverity).toBe("moderate");
    expect(result.hasEscalationSignal).toBe(false);
    expect(result.recommendedResponses).toEqual(["raise_warning"]);
  });

  it("sets escalation to true for a high signal", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          contextSwitchCount: 8
        }
      })
    );

    expect(result.overallSeverity).toBe("high");
    expect(result.hasEscalationSignal).toBe(true);
    expect(result.recommendedResponses).toEqual(["escalate_to_review"]);
  });

  it("sets escalation to true for a critical signal", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          nonStudyContextDetected: true,
          nonStudyContextMinutes: 10
        }
      })
    );

    expect(result.overallSeverity).toBe("critical");
    expect(result.hasEscalationSignal).toBe(true);
    expect(result.recommendedResponses).toEqual(["flag_for_admin"]);
  });

  it("handles multiple simultaneous signals", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          longestIdleStretchMinutes: 5,
          contextSwitchCount: 8,
          nonStudyContextDetected: true,
          nonStudyContextMinutes: 1
        },
        session: {
          ...createInput().session,
          currentWarningActive: true,
          currentWarningDurationMinutes: 5
        },
        history: {
          ...createInput().history,
          armingCancelCount: 1
        }
      })
    );

    expect(
      result.patterns
        .filter((pattern) => pattern.detected)
        .map((pattern) => pattern.pattern)
    ).toEqual([
      "prolonged_idle",
      "non_study_context",
      "focus_instability",
      "arming_avoidance",
      "active_warning_escalation"
    ]);
  });

  it("uses the maximum detected severity as overallSeverity", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          longestIdleStretchMinutes: 5,
          nonStudyContextDetected: true,
          nonStudyContextMinutes: 10
        }
      })
    );

    expect(result.overallSeverity).toBe("critical");
  });

  it("deduplicates recommended responses", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          longestIdleStretchMinutes: 5,
          contextSwitchCount: 4
        }
      })
    );

    expect(result.recommendedResponses).toEqual(["nudge_user"]);
  });

  it("preserves mixed-severity responses while still deduplicating duplicates", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          contextSwitchCount: 4,
          nonStudyContextDetected: true,
          nonStudyContextMinutes: 3
        },
        history: {
          ...createInput().history,
          armingCancelCount: 3
        }
      })
    );

    expect(result.recommendedResponses).toEqual([
      "nudge_user",
      "raise_warning",
      "escalate_to_review"
    ]);
  });

  it("returns all evaluated patterns in the patterns array", () => {
    const result = analyzeAvoidance(createInput());

    expect(result.patterns.map((pattern) => pattern.pattern)).toEqual([
      "prolonged_idle",
      "non_study_context",
      "focus_instability",
      "repeated_warning_cycles",
      "stalled_session_start",
      "arming_avoidance",
      "active_warning_escalation"
    ]);
  });

  it("sets hasEscalationSignal to false when only low and moderate signals exist", () => {
    const result = analyzeAvoidance(
      createInput({
        behavior: {
          ...createInput().behavior,
          idleMinutes: 2,
          inputActivityLevel: "minimal",
          contextSwitchCount: 4
        }
      })
    );

    expect(result.hasEscalationSignal).toBe(false);
  });
});
