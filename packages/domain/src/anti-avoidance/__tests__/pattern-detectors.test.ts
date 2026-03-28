import { describe, expect, it } from "vitest";
import {
  detectActiveWarningEscalation,
  detectArmingAvoidance,
  detectFocusInstability,
  detectNonStudyContext,
  detectProlongedIdle,
  detectRepeatedWarningCycles,
  detectStalledSessionStart,
  type AntiAvoidanceInput
} from "..";

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

describe("detectProlongedIdle", () => {
  it("returns none when no idle pattern exists", () => {
    expect(detectProlongedIdle(createInput())).toMatchObject({
      detected: false,
      severity: "none"
    });
  });

  it("returns low for low-input idle behavior", () => {
    expect(
      detectProlongedIdle(
        createInput({
          behavior: {
            ...createInput().behavior,
            idleMinutes: 2,
            inputActivityLevel: "minimal"
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "low"
    });
  });

  it("returns moderate at the warning boundary", () => {
    expect(
      detectProlongedIdle(
        createInput({
          behavior: {
            ...createInput().behavior,
            longestIdleStretchMinutes: 5
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "moderate"
    });
  });

  it("returns critical at the critical boundary", () => {
    expect(
      detectProlongedIdle(
        createInput({
          behavior: {
            ...createInput().behavior,
            longestIdleStretchMinutes: 15
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "critical"
    });
  });
});

describe("detectNonStudyContext", () => {
  it("returns none when no non-study context is detected", () => {
    expect(detectNonStudyContext(createInput())).toMatchObject({
      detected: false,
      severity: "none"
    });
  });

  it("returns low for brief non-study context exposure", () => {
    expect(
      detectNonStudyContext(
        createInput({
          behavior: {
            ...createInput().behavior,
            nonStudyContextDetected: true,
            nonStudyContextMinutes: 1
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "low"
    });
  });

  it("returns moderate at the warning boundary", () => {
    expect(
      detectNonStudyContext(
        createInput({
          behavior: {
            ...createInput().behavior,
            nonStudyContextDetected: true,
            nonStudyContextMinutes: 3
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "moderate"
    });
  });

  it("returns critical at the critical boundary", () => {
    expect(
      detectNonStudyContext(
        createInput({
          behavior: {
            ...createInput().behavior,
            nonStudyContextDetected: true,
            nonStudyContextMinutes: 10
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "critical"
    });
  });
});

describe("detectFocusInstability", () => {
  it("returns none when there are no context switches", () => {
    expect(detectFocusInstability(createInput())).toMatchObject({
      detected: false,
      severity: "none"
    });
  });

  it("returns low for a small number of context switches", () => {
    expect(
      detectFocusInstability(
        createInput({
          behavior: {
            ...createInput().behavior,
            contextSwitchCount: 2
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "low"
    });
  });

  it("returns moderate at the warning boundary", () => {
    expect(
      detectFocusInstability(
        createInput({
          behavior: {
            ...createInput().behavior,
            contextSwitchCount: 4
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "moderate"
    });
  });

  it("returns high at the critical boundary", () => {
    expect(
      detectFocusInstability(
        createInput({
          behavior: {
            ...createInput().behavior,
            contextSwitchCount: 8
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "high"
    });
  });
});

describe("detectRepeatedWarningCycles", () => {
  it("returns none when no warning cycling exists", () => {
    expect(detectRepeatedWarningCycles(createInput())).toMatchObject({
      detected: false,
      severity: "none"
    });
  });

  it("returns low for early repetition", () => {
    expect(
      detectRepeatedWarningCycles(
        createInput({
          session: {
            ...createInput().session,
            warningCount: 1
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "low"
    });
  });

  it("returns moderate for repeated warning/recovery cycling", () => {
    expect(
      detectRepeatedWarningCycles(
        createInput({
          session: {
            ...createInput().session,
            warningCount: 2
          },
          history: {
            ...createInput().history,
            warningRecoveryCount: 1
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "moderate"
    });
  });

  it("returns high when escalation count reaches the threshold", () => {
    expect(
      detectRepeatedWarningCycles(
        createInput({
          history: {
            ...createInput().history,
            warningEscalationCount: 3
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "high"
    });
  });
});

describe("detectStalledSessionStart", () => {
  it("does not trigger in planned state", () => {
    expect(
      detectStalledSessionStart(
        createInput({
          session: {
            ...createInput().session,
            state: "planned",
            elapsedMinutes: 20,
            validMinutes: 0
          }
        })
      )
    ).toMatchObject({
      detected: false,
      severity: "none"
    });
  });

  it("triggers after the threshold with zero valid minutes", () => {
    expect(
      detectStalledSessionStart(
        createInput({
          session: {
            ...createInput().session,
            state: "armed",
            elapsedMinutes: 11,
            validMinutes: 0
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "moderate"
    });
  });

  it("returns high when the delay is much greater than the threshold", () => {
    expect(
      detectStalledSessionStart(
        createInput({
          session: {
            ...createInput().session,
            state: "active_valid",
            elapsedMinutes: 20,
            validMinutes: 0
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "high"
    });
  });
});

describe("detectArmingAvoidance", () => {
  it("returns low below the escalation threshold", () => {
    expect(
      detectArmingAvoidance(
        createInput({
          history: {
            ...createInput().history,
            armingCancelCount: 1
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "low"
    });
  });

  it("returns moderate for repeated cancels below the escalation threshold", () => {
    expect(
      detectArmingAvoidance(
        createInput({
          history: {
            ...createInput().history,
            armingAttemptCount: 3,
            armingCancelCount: 2
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "moderate"
    });
  });

  it("returns high at the escalation threshold", () => {
    expect(
      detectArmingAvoidance(
        createInput({
          history: {
            ...createInput().history,
            armingAttemptCount: 4,
            armingCancelCount: 3
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "high"
    });
  });
});

describe("detectActiveWarningEscalation", () => {
  it("returns none when no warning is active", () => {
    expect(detectActiveWarningEscalation(createInput())).toMatchObject({
      detected: false,
      severity: "none"
    });
  });

  it("returns none when a warning is active but still below the escalation threshold", () => {
    expect(
      detectActiveWarningEscalation(
        createInput({
          session: {
            ...createInput().session,
            currentWarningActive: true,
            currentWarningDurationMinutes: 4
          }
        })
      )
    ).toMatchObject({
      detected: false,
      severity: "none"
    });
  });

  it("returns high at the warning boundary", () => {
    expect(
      detectActiveWarningEscalation(
        createInput({
          session: {
            ...createInput().session,
            currentWarningActive: true,
            currentWarningDurationMinutes: 5
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "high"
    });
  });

  it("returns critical at the critical boundary", () => {
    expect(
      detectActiveWarningEscalation(
        createInput({
          session: {
            ...createInput().session,
            currentWarningActive: true,
            currentWarningDurationMinutes: 15
          }
        })
      )
    ).toMatchObject({
      detected: true,
      severity: "critical"
    });
  });
});
