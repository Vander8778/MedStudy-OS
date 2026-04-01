import { calculateAvatarStatProgress } from "./avatar-stat-calculator";
import { calculateLevelUpdate } from "./level-calculator";
import { calculateMasteryProgress } from "./mastery-calculator";
import { calculateStreak } from "./streak-calculator";
import { evaluateUnlocks } from "./unlock-evaluator";
import { calculateXP } from "./xp-calculator";
import type { GamificationInput, GamificationResult, GamificationTrigger } from "./types";

export function processSessionOutcome(
  input: GamificationInput
): GamificationResult {
  const streakChange = calculateStreak({
    sessionOutcome: input.sessionOutcome,
    currentStreak: input.currentStreak,
    qualifyingDate: input.qualifyingDate
  });

  const mastery = calculateMasteryProgress({
    sessionOutcome: input.sessionOutcome,
    finalScore: input.finalScore,
    hasCriticalViolation: input.hasCriticalViolation,
    currentMasteryTracks: input.currentMasteryTracks
  });

  const xp = calculateXP({
    sessionOutcome: input.sessionOutcome,
    hasCriticalViolation: input.hasCriticalViolation,
    checkpointsCompleted: input.checkpointsCompleted,
    artifactsAccepted: input.artifactsAccepted,
    vivaAttempts: input.vivaAttempts,
    // Intentional: streak XP uses the post-session streak length so the session that
    // reaches a qualifying streak threshold is the first one to receive that bonus.
    streakLength: streakChange.streak.currentLength,
    avoidanceDetected: input.avoidanceDetected,
    avoidanceRecovered: input.avoidanceRecovered,
    masteryLevelsGained: mastery.totalLevelsGained,
    xpEarnedToday: input.xpEarnedToday
  });

  const avatarStatsResult = calculateAvatarStatProgress({
    sessionOutcome: input.sessionOutcome,
    hasCriticalViolation: input.hasCriticalViolation,
    validTimeScore: input.scoringBreakdown.validTimeScore,
    artifactScore: input.scoringBreakdown.artifactScore,
    knowledgeScore: input.scoringBreakdown.knowledgeScore,
    currentStreakLength: streakChange.streak.currentLength,
    avoidanceRecovered: input.avoidanceRecovered,
    currentAvatarStats: input.currentAvatarStats
  });

  const level = calculateLevelUpdate(input.currentUserLevel, xp.totalXPAwarded);
  const unlocks = evaluateUnlocks({
    unlockConditions: input.unlockConditions,
    alreadyUnlockedAvatarIds: input.alreadyUnlockedAvatarIds,
    streak: streakChange.streak,
    avatarStats: avatarStatsResult.newStats,
    level,
    masteryUpdates: mastery.updates,
    sessionOutcomeCounts: input.sessionOutcomeCounts,
    contractCompletionCount: input.contractCompletionCount
  });

  const triggers: GamificationTrigger[] = [];

  if (xp.totalXPAwarded > 0) {
    triggers.push({
      type: "xp_awarded",
      metadata: {
        totalXPAwarded: xp.totalXPAwarded
      }
    });
  }

  if (streakChange.incremented) {
    triggers.push({
      type: "streak_updated",
      metadata: {
        currentLength: streakChange.streak.currentLength,
        longestLength: streakChange.streak.longestLength
      }
    });
  }

  if (streakChange.broken) {
    triggers.push({
      type: "streak_broken",
      metadata: {
        currentLength: streakChange.streak.currentLength
      }
    });
  }

  for (const delta of avatarStatsResult.deltas) {
    triggers.push({
      type: "avatar_stat_changed",
      metadata: {
        statKey: delta.key,
        delta: delta.delta,
        newValue: delta.newValue
      }
    });
  }

  for (const update of mastery.updates.filter((item) => item.levelsGained > 0)) {
    triggers.push({
      type: "mastery_level_up",
      metadata: {
        trackId: update.trackId,
        trackKey: update.trackKey,
        levelsGained: update.levelsGained,
        newLevel: update.newLevel
      }
    });
  }

  if (level.leveledUp) {
    triggers.push({
      type: "level_up",
      metadata: {
        previousLevel: level.previousLevel,
        newLevel: level.newLevel
      }
    });
  }

  for (const unlock of unlocks) {
    triggers.push({
      type: "avatar_unlocked",
      metadata: {
        avatarId: unlock.avatarId,
        conditionId: unlock.conditionId,
        conditionType: unlock.conditionType
      }
    });
  }

  return {
    userId: input.userId,
    sessionId: input.sessionId,
    qualifyingDate: input.qualifyingDate,
    xp,
    streak: streakChange.streak,
    streakChange,
    avatarStats: avatarStatsResult.newStats,
    avatarStatDeltas: avatarStatsResult.deltas,
    level,
    mastery,
    unlocks,
    triggers
  };
}
