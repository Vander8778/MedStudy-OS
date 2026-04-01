import type {
  AvatarStats,
  LevelUpdate,
  MasteryTrackUpdate,
  StreakRecord,
  UnlockAward,
  UnlockCondition
} from "./types";

type UnlockEvaluationInput = {
  unlockConditions: readonly UnlockCondition[];
  alreadyUnlockedAvatarIds: readonly string[];
  streak: StreakRecord;
  avatarStats: AvatarStats;
  level: LevelUpdate;
  masteryUpdates: readonly MasteryTrackUpdate[];
  sessionOutcomeCounts: Record<"completed" | "partial" | "failed" | "penalized", number>;
  contractCompletionCount: number;
};

function getAvatarStatValue(
  avatarStats: AvatarStats,
  statKey: "discipline" | "consistency" | "clinicalThinking" | "knowledgeDepth" | "recovery"
) {
  switch (statKey) {
    case "discipline":
      return avatarStats.discipline;
    case "consistency":
      return avatarStats.consistency;
    case "clinicalThinking":
      return avatarStats.clinicalThinking;
    case "knowledgeDepth":
      return avatarStats.knowledgeDepth;
    case "recovery":
      return avatarStats.recovery;
  }
}

function isConditionMet(
  condition: UnlockCondition,
  input: UnlockEvaluationInput
) {
  switch (condition.type) {
    case "streak_reached":
      return input.streak.currentLength >= condition.threshold;
    case "mastery_level_reached":
      return input.masteryUpdates.some(
        (update) =>
          update.trackKey === condition.trackKey &&
          update.newLevel >= condition.threshold
      );
    case "total_xp_reached":
      return input.level.totalXP >= condition.threshold;
    case "stat_threshold_reached":
      return (
        getAvatarStatValue(input.avatarStats, condition.statKey) >=
        condition.threshold
      );
    case "session_outcome_count":
      return input.sessionOutcomeCounts[condition.outcome] >= condition.threshold;
    case "contract_completion":
      return input.contractCompletionCount >= condition.threshold;
    default:
      return false;
  }
}

export function evaluateUnlocks(
  input: UnlockEvaluationInput
): readonly UnlockAward[] {
  const excludedAvatarIds = new Set(input.alreadyUnlockedAvatarIds);
  const unlocks: UnlockAward[] = [];

  for (const condition of input.unlockConditions) {
    if (excludedAvatarIds.has(condition.avatarId)) {
      continue;
    }

    if (!isConditionMet(condition, input)) {
      continue;
    }

    unlocks.push({
      avatarId: condition.avatarId,
      conditionId: condition.id,
      conditionType: condition.type
    });
    excludedAvatarIds.add(condition.avatarId);
  }

  return unlocks;
}
