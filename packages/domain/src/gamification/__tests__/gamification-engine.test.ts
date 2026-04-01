import { describe, expect, it } from "vitest";
import { processSessionOutcome } from "../gamification-engine";

function createInput() {
  return {
    userId: "user_1",
    sessionId: "session_1",
    sessionOutcome: "completed",
    finalScore: 80,
    scoringBreakdown: {
      validTimeScore: 80,
      processScore: 70,
      artifactScore: 75,
      knowledgeScore: 90
    },
    hardFailApplied: false,
    checkpointsCompleted: 3,
    checkpointsMissed: 0,
    artifactsAccepted: 1,
    vivaAttempts: 1,
    contractViolationCount: 0,
    hasCriticalViolation: false,
    avoidanceDetected: true,
    avoidanceRecovered: true,
    sessionDurationMinutes: 60,
    validMinutes: 55,
    sessionEndedAt: "2026-04-01T10:00:00.000Z",
    qualifyingDate: "2026-04-01",
    currentStreak: {
      currentLength: 2,
      longestLength: 2,
      lastQualifyingDate: "2026-03-31"
    },
    currentAvatarStats: {
      discipline: 10,
      consistency: 10,
      clinicalThinking: 10,
      knowledgeDepth: 10,
      recovery: 10
    },
    currentUserLevel: {
      level: 1,
      totalXP: 90
    },
    currentMasteryTracks: [
      {
        id: "track_1",
        key: "cardiology",
        currentLevel: 1,
        maxLevel: 3,
        progressPercent: 80
      }
    ],
    xpEarnedToday: 0,
    sessionOutcomeCounts: {
      completed: 5,
      partial: 1,
      failed: 0,
      penalized: 0
    },
    contractCompletionCount: 1,
    unlockConditions: [
      {
        id: "unlock_1",
        avatarId: "avatar_streak",
        type: "streak_reached",
        threshold: 3
      }
    ],
    alreadyUnlockedAvatarIds: []
  } as never;
}

describe("processSessionOutcome", () => {
  it("processes a full successful session path", () => {
    const result = processSessionOutcome(createInput());

    expect(result.xp.totalXPAwarded).toBe(235);
    expect(result.streak.currentLength).toBe(3);
    expect(result.level).toMatchObject({
      previousLevel: 1,
      newLevel: 3,
      leveledUp: true
    });
    expect(result.mastery.totalLevelsGained).toBe(1);
    expect(result.unlocks).toEqual([
      {
        avatarId: "avatar_streak",
        conditionId: "unlock_1",
        conditionType: "streak_reached"
      }
    ]);
    expect(result.triggers.map((trigger) => trigger.type)).toEqual(
      expect.arrayContaining([
        "xp_awarded",
        "streak_updated",
        "avatar_stat_changed",
        "mastery_level_up",
        "level_up",
        "avatar_unlocked"
      ])
    );
  });

  it("produces a zero-reward failed path without stat or level gains", () => {
    const result = processSessionOutcome({
      ...createInput(),
      sessionOutcome: "failed",
      checkpointsCompleted: 5,
      artifactsAccepted: 3,
      vivaAttempts: 2
    });

    expect(result.xp.totalXPAwarded).toBe(0);
    expect(result.xp.zeroRewardReason).toBe("failed_session");
    expect(result.avatarStatDeltas).toEqual([]);
    expect(result.level.leveledUp).toBe(false);
    expect(result.streak.currentLength).toBe(2);
  });

  it("applies anti-farming clamps on oversized sessions", () => {
    const result = processSessionOutcome({
      ...createInput(),
      checkpointsCompleted: 99,
      artifactsAccepted: 99,
      vivaAttempts: 99,
      xpEarnedToday: 450
    });

    expect(result.xp.totalXPAwarded).toBe(50);
    expect(result.xp.dailyCapApplied).toBe(true);
  });
});
