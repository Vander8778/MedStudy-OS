import { describe, expect, it } from "vitest";
import { calculateXP } from "../xp-calculator";

function createInput() {
  return {
    sessionOutcome: "completed",
    hasCriticalViolation: false,
    checkpointsCompleted: 0,
    artifactsAccepted: 0,
    vivaAttempts: 0,
    streakLength: 0,
    avoidanceDetected: false,
    avoidanceRecovered: false,
    masteryLevelsGained: 0,
    xpEarnedToday: 0
  } as const;
}

describe("calculateXP", () => {
  it("calculates completed-session XP on the happy path", () => {
    const result = calculateXP({
      ...createInput(),
      sessionOutcome: "completed",
      checkpointsCompleted: 3,
      artifactsAccepted: 1,
      vivaAttempts: 1,
      streakLength: 4,
      avoidanceDetected: true,
      avoidanceRecovered: true
    });

    expect(result.totalXPRequested).toBe(210);
    expect(result.totalXPAwarded).toBe(210);
    expect(result.ledger.map((entry) => [entry.source, entry.awardedAmount])).toEqual([
      ["session_completed", 100],
      ["checkpoint_completed", 30],
      ["artifact_accepted", 15],
      ["viva_passed", 25],
      ["streak_bonus", 20],
      ["recovery_bonus", 20]
    ]);
  });

  it("calculates partial-session XP on the happy path", () => {
    const result = calculateXP({
      ...createInput(),
      sessionOutcome: "partial",
      checkpointsCompleted: 2
    });

    expect(result.totalXPRequested).toBe(60);
    expect(result.totalXPAwarded).toBe(60);
    expect(result.ledger.map((entry) => entry.source)).toEqual([
      "session_partial",
      "checkpoint_completed"
    ]);
  });

  it("returns zero XP for failed sessions", () => {
    const result = calculateXP({
      ...createInput(),
      sessionOutcome: "failed",
      checkpointsCompleted: 5
    });

    expect(result.totalXPAwarded).toBe(0);
    expect(result.zeroRewardReason).toBe("failed_session");
    expect(result.ledger).toEqual([]);
  });

  it("returns zero XP for sessions with critical violations", () => {
    const result = calculateXP({
      ...createInput(),
      hasCriticalViolation: true,
      checkpointsCompleted: 5
    });

    expect(result.totalXPAwarded).toBe(0);
    expect(result.zeroRewardReason).toBe("critical_violation");
    expect(result.ledger).toEqual([]);
  });

  it("applies the per-session XP cap in ledger order", () => {
    const result = calculateXP({
      ...createInput(),
      checkpointsCompleted: 8,
      artifactsAccepted: 5,
      vivaAttempts: 4,
      streakLength: 10,
      masteryLevelsGained: 3,
      avoidanceDetected: true,
      avoidanceRecovered: true
    });

    expect(result.totalXPRequested).toBe(405);
    expect(result.totalXPAwarded).toBe(275);
    expect(result.sessionCapApplied).toBe(true);
    expect(result.dailyCapApplied).toBe(false);
    expect(result.ledger.map((entry) => [entry.source, entry.awardedAmount])).toEqual([
      ["session_completed", 100],
      ["checkpoint_completed", 50],
      ["artifact_accepted", 45],
      ["viva_passed", 50],
      ["streak_bonus", 30],
      ["mastery_level_up", 0],
      ["recovery_bonus", 0]
    ]);
  });

  it("applies the daily XP cap after the session cap", () => {
    const result = calculateXP({
      ...createInput(),
      checkpointsCompleted: 2,
      xpEarnedToday: 490
    });

    expect(result.totalXPRequested).toBe(120);
    expect(result.totalXPAwarded).toBe(10);
    expect(result.sessionCapApplied).toBe(false);
    expect(result.dailyCapApplied).toBe(true);
    expect(result.ledger.map((entry) => [entry.source, entry.awardedAmount])).toEqual([
      ["session_completed", 10],
      ["checkpoint_completed", 0]
    ]);
  });

  it("awards zero XP when the daily cap is already exhausted", () => {
    const result = calculateXP({
      ...createInput(),
      checkpointsCompleted: 3,
      xpEarnedToday: 500
    });

    expect(result.totalXPRequested).toBe(130);
    expect(result.totalXPAwarded).toBe(0);
    expect(result.dailyCapApplied).toBe(true);
    expect(result.ledger.map((entry) => entry.awardedAmount)).toEqual([0, 0]);
  });

  it("applies checkpoint, artifact, and viva item caps", () => {
    const result = calculateXP({
      ...createInput(),
      checkpointsCompleted: 99,
      artifactsAccepted: 99,
      vivaAttempts: 99
    });

    expect(result.ledger.find((entry) => entry.source === "checkpoint_completed")?.requestedAmount).toBe(50);
    expect(result.ledger.find((entry) => entry.source === "artifact_accepted")?.requestedAmount).toBe(45);
    expect(result.ledger.find((entry) => entry.source === "viva_passed")?.requestedAmount).toBe(50);
  });

  it("applies streak, recovery, and mastery bonuses", () => {
    const result = calculateXP({
      ...createInput(),
      sessionOutcome: "partial",
      streakLength: 12,
      avoidanceDetected: true,
      avoidanceRecovered: true,
      masteryLevelsGained: 2
    });

    expect(result.ledger.map((entry) => [entry.source, entry.requestedAmount])).toEqual([
      ["session_partial", 40],
      ["streak_bonus", 50],
      ["mastery_level_up", 60],
      ["recovery_bonus", 20]
    ]);
    expect(result.totalXPAwarded).toBe(170);
  });
});
