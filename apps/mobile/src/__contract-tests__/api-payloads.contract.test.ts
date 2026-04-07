import { describe, expect, it } from "vitest";
import {
  getSessionResponseSchema,
  progressSummarySchema,
  reviewResultResponseSchema,
  submitArtifactRequestSchema
} from "@medstudy/contracts";

describe("mobile API payload contract compliance", () => {
  it("accepts artifact submit requests and session/result responses used by mobile", () => {
    expect(
      submitArtifactRequestSchema.parse({
        type: "final_submission",
        title: "Mobile note",
        source: "user_upload",
        status: "submitted"
      })
    ).toMatchObject({
      type: "final_submission"
    });

    const session = getSessionResponseSchema.parse({
      session: {
        id: "session_fixture",
        userId: "user_fixture",
        profileId: "profile_fixture",
        contractId: "contract_fixture",
        title: "Mobile session",
        objective: "Read backend truth",
        state: "paused_valid",
        plannedRange: {
          startsAt: "2026-04-07T09:00:00.000Z",
          endsAt: "2026-04-07T10:00:00.000Z"
        },
        startedAt: "2026-04-07T09:00:00.000Z",
        validMinutes: 25,
        invalidMinutes: 0,
        warningCount: 0,
        missedCheckpointCount: 0,
        finalArtifactRequired: true,
        createdAt: "2026-04-07T08:55:00.000Z",
        updatedAt: "2026-04-07T09:25:00.000Z"
      },
      contract: {
        id: "contract_fixture",
        userId: "user_fixture",
        name: "Fixture contract",
        status: "active",
        terms: {
          minValidMinutes: 45,
          maxMissedCheckpoints: 1,
          mandatoryArtifactTypes: ["final_submission"],
          vivaPassingScore: 70
        },
        activeRange: {
          startsAt: "2026-04-07T09:00:00.000Z",
          endsAt: "2026-04-30T09:00:00.000Z"
        },
        tags: [],
        createdAt: "2026-04-07T08:00:00.000Z",
        updatedAt: "2026-04-07T08:00:00.000Z"
      },
      checkpoints: [],
      artifacts: [],
      vivaAttempts: [],
      blocks: [],
      penalties: []
    });

    expect(session.session.state).toBe("paused_valid");

    expect(
      reviewResultResponseSchema.parse({
        session: {
          ...session.session,
          state: "completed",
          endedAt: "2026-04-07T10:00:00.000Z",
          validMinutes: 60,
          updatedAt: "2026-04-07T10:00:00.000Z"
        },
        scoring: {
          outcome: "completed",
          sessionScore: 92,
          components: {
            validTime: { raw: 100, weight: 0.35, weighted: 35 },
            process: { raw: 90, weight: 0.2, weighted: 18 },
            artifact: { raw: 100, weight: 0.25, weighted: 25 },
            knowledge: { raw: 70, weight: 0.2, weighted: 14 }
          },
          hardFailTriggered: false,
          hardFailReasons: [],
          decisionTrace: {
            decidedByHardFail: false,
            scoreThresholdApplied: {
              min: 85,
              max: 100,
              outcome: "completed"
            }
          }
        },
        contractEvaluation: {
          allRulesPassed: true,
          hasCriticalViolation: false,
          criticalViolationCodes: [],
          warningCodes: [],
          informationalCodes: ["valid_time_met"]
        }
      }).scoring.outcome
    ).toBe("completed");
  });

  it("accepts progress summaries used by mobile read-heavy screens", () => {
    expect(
      progressSummarySchema.parse({
        userId: "user_fixture",
        totalXP: 320,
        level: {
          level: 3,
          totalXP: 320,
          xpToNextLevel: 80
        },
        streak: {
          currentLength: 4,
          longestLength: 6,
          lastQualifyingDate: "2026-04-07"
        },
        avatarStats: {
          discipline: 30,
          consistency: 35,
          clinicalThinking: 20,
          knowledgeDepth: 28,
          recovery: 18
        },
        masteryTracks: [],
        unlockedAvatarIds: []
      }).level.level
    ).toBe(3);
  });
});
