import { describe, expect, it } from "vitest";
import {
  getAvatarStatusLabel,
  getHomeScreenSections,
  getOfflineBannerMessage,
  getSessionDetailSections
} from "../utils/screen-models";

const homeSummary = {
  activeSession: {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Cardiology Focus",
      objective: "Review rhythm strips",
      state: "active_valid" as const,
      plannedRange: {
        startsAt: "2026-04-05T10:00:00.000Z",
        endsAt: "2026-04-05T11:00:00.000Z"
      },
      validMinutes: 35,
      invalidMinutes: 5,
      warningCount: 1,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      createdAt: "2026-04-05T09:00:00.000Z",
      updatedAt: "2026-04-05T10:35:00.000Z"
    },
    contract: {
      id: "contract_1",
      userId: "user_1",
      name: "Core Contract",
      status: "active" as const,
      terms: {
        minValidMinutes: 45,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70
      },
      activeRange: {
        startsAt: "2026-04-01T00:00:00.000Z",
        endsAt: "2026-05-01T00:00:00.000Z"
      },
      tags: [],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z"
    },
    checkpoints: [
      {
        id: "checkpoint_1",
        sessionId: "session_1",
        order: 0,
        title: "Explain next step",
        status: "due" as const,
        dueAt: "2026-04-05T10:40:00.000Z",
        createdAt: "2026-04-05T10:00:00.000Z",
        updatedAt: "2026-04-05T10:00:00.000Z"
      }
    ],
    artifacts: [],
    vivaAttempts: [],
    blocks: [],
    penalties: []
  },
  plannedSession: null,
  dueCheckpoints: [
    {
      id: "checkpoint_1",
      sessionId: "session_1",
      order: 0,
      title: "Explain next step",
      status: "due" as const,
      dueAt: "2026-04-05T10:40:00.000Z",
      createdAt: "2026-04-05T10:00:00.000Z",
      updatedAt: "2026-04-05T10:00:00.000Z"
    }
  ],
  recentResults: [
    {
      session: {
        id: "session_0",
        userId: "user_1",
        profileId: "profile_1",
        contractId: "contract_1",
        title: "Anatomy Review",
        objective: "Past session",
        state: "completed" as const,
        plannedRange: {
          startsAt: "2026-04-04T10:00:00.000Z",
          endsAt: "2026-04-04T11:00:00.000Z"
        },
        validMinutes: 50,
        invalidMinutes: 0,
        warningCount: 0,
        missedCheckpointCount: 0,
        finalArtifactRequired: true,
        createdAt: "2026-04-04T09:00:00.000Z",
        updatedAt: "2026-04-04T11:05:00.000Z"
      },
      scoring: {
        outcome: "completed" as const,
        sessionScore: 91,
        components: {
          validTime: { raw: 95, weight: 0.35, weighted: 33.25 },
          process: { raw: 88, weight: 0.25, weighted: 22 },
          artifact: { raw: 90, weight: 0.2, weighted: 18 },
          knowledge: { raw: 89, weight: 0.2, weighted: 17.8 }
        },
        hardFailTriggered: false,
        hardFailReasons: [],
        decisionTrace: {
          decidedByHardFail: false,
          scoreThresholdApplied: {
            min: 70,
            max: 100,
            outcome: "completed"
          }
        }
      }
    }
  ],
  progress: {
    userId: "user_1",
    totalXP: 1200,
    level: {
      level: 4,
      totalXP: 1200,
      xpToNextLevel: 300
    },
    streak: {
      currentLength: 5,
      longestLength: 9
    },
    avatarStats: {
      discipline: 75,
      consistency: 68,
      clinicalThinking: 70,
      knowledgeDepth: 66,
      recovery: 80
    },
    masteryTracks: [],
    unlockedAvatarIds: ["avatar_1"]
  }
} as const;

describe("mobile UI content", () => {
  it("builds home sections from provided summary", () => {
    const model = getHomeScreenSections(homeSummary);
    expect(model.hasSessionCard).toBe(true);
    expect(model.hasDueCheckpoints).toBe(true);
    expect(model.hasRecentResults).toBe(true);
    expect(model.headings).toEqual([
      "Today",
      "Due checkpoints",
      "Recent results",
      "Progress snapshot"
    ]);
  });

  it("builds session detail sections from backend state", () => {
    const model = getSessionDetailSections(
      homeSummary.activeSession,
      homeSummary.recentResults[0].scoring
    );
    expect(model.headings).toEqual(["Checkpoints", "Artifacts", "Viva"]);
    expect(model.warningCount).toBe(1);
    expect(model.hasScore).toBe(true);
  });

  it("builds offline and avatar labels clearly", () => {
    expect(getOfflineBannerMessage(false)).toContain("Offline mode");
    expect(
      getAvatarStatusLabel({
        avatar: {
          id: "avatar_1",
          code: "mentor",
          name: "Mentor",
          rarity: "rare",
          isDefault: false,
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z"
        },
        unlocked: true,
        equipped: true
      })
    ).toBe("Equipped");
  });
});
