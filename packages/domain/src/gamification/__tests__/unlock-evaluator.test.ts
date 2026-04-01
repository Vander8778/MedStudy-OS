import { describe, expect, it } from "vitest";
import { evaluateUnlocks } from "../unlock-evaluator";

function createInput() {
  return {
    alreadyUnlockedAvatarIds: [],
    streak: {
      currentLength: 7,
      longestLength: 7,
      lastQualifyingDate: "2026-04-01"
    },
    avatarStats: {
      discipline: 60,
      consistency: 55,
      clinicalThinking: 40,
      knowledgeDepth: 45,
      recovery: 30
    },
    level: {
      previousLevel: 1,
      newLevel: 3,
      totalXP: 320,
      xpToNextLevel: 280,
      leveledUp: true
    },
    masteryUpdates: [
      {
        trackId: "track_1",
        trackKey: "cardiology",
        previousLevel: 1,
        newLevel: 2,
        previousProgressPercent: 90,
        newProgressPercent: 10,
        levelsGained: 1,
        leveledUp: true
      }
    ],
    sessionOutcomeCounts: {
      completed: 5,
      partial: 1,
      failed: 2,
      penalized: 0
    },
    contractCompletionCount: 2
  } as never;
}

describe("evaluateUnlocks", () => {
  it("evaluates each supported unlock condition type", () => {
    const result = evaluateUnlocks({
      ...createInput(),
      unlockConditions: [
        { id: "c1", avatarId: "avatar_streak", type: "streak_reached", threshold: 7 },
        {
          id: "c2",
          avatarId: "avatar_mastery",
          type: "mastery_level_reached",
          trackKey: "cardiology",
          threshold: 2
        },
        { id: "c3", avatarId: "avatar_xp", type: "total_xp_reached", threshold: 300 },
        {
          id: "c4",
          avatarId: "avatar_stat",
          type: "stat_threshold_reached",
          statKey: "discipline",
          threshold: 60
        },
        {
          id: "c5",
          avatarId: "avatar_sessions",
          type: "session_outcome_count",
          outcome: "completed",
          threshold: 5
        },
        {
          id: "c6",
          avatarId: "avatar_contract",
          type: "contract_completion",
          threshold: 2
        }
      ]
    });

    expect(result.map((unlock) => unlock.avatarId)).toEqual([
      "avatar_streak",
      "avatar_mastery",
      "avatar_xp",
      "avatar_stat",
      "avatar_sessions",
      "avatar_contract"
    ]);
  });

  it("excludes avatars that are already unlocked", () => {
    const result = evaluateUnlocks({
      ...createInput(),
      alreadyUnlockedAvatarIds: ["avatar_streak"],
      unlockConditions: [
        { id: "c1", avatarId: "avatar_streak", type: "streak_reached", threshold: 7 },
        { id: "c2", avatarId: "avatar_xp", type: "total_xp_reached", threshold: 300 }
      ]
    });

    expect(result).toEqual([
      {
        avatarId: "avatar_xp",
        conditionId: "c2",
        conditionType: "total_xp_reached"
      }
    ]);
  });

  it("allows edge-equality thresholds and rejects below-threshold conditions", () => {
    const result = evaluateUnlocks({
      ...createInput(),
      unlockConditions: [
        { id: "c1", avatarId: "avatar_equal", type: "streak_reached", threshold: 7 },
        { id: "c2", avatarId: "avatar_high", type: "total_xp_reached", threshold: 321 }
      ]
    });

    expect(result).toEqual([
      {
        avatarId: "avatar_equal",
        conditionId: "c1",
        conditionType: "streak_reached"
      }
    ]);
  });

  it("deduplicates multiple matching conditions for the same avatar", () => {
    const result = evaluateUnlocks({
      ...createInput(),
      unlockConditions: [
        { id: "c1", avatarId: "avatar_shared", type: "streak_reached", threshold: 7 },
        { id: "c2", avatarId: "avatar_shared", type: "total_xp_reached", threshold: 300 }
      ]
    });

    expect(result).toEqual([
      {
        avatarId: "avatar_shared",
        conditionId: "c1",
        conditionType: "streak_reached"
      }
    ]);
  });

  it("does not unlock mastery conditions when the track key does not match", () => {
    const result = evaluateUnlocks({
      ...createInput(),
      unlockConditions: [
        {
          id: "c1",
          avatarId: "avatar_mastery",
          type: "mastery_level_reached",
          trackKey: "neurology",
          threshold: 2
        }
      ]
    });

    expect(result).toEqual([]);
  });
});
