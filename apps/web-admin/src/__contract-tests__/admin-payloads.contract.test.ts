import { describe, expect, it } from "vitest";
import {
  getEventsResponseSchema,
  getScoringResponseSchema,
  getSessionResponseSchema,
  sessionActionRequestSchema
} from "@medstudy/contracts";

describe("web admin payload contract compliance", () => {
  it("accepts admin action payloads and session-detail constituent responses", () => {
    expect(
      sessionActionRequestSchema.parse({
        actor: {
          actorType: "admin",
          userId: "admin_fixture",
          label: "admin.dashboard"
        }
      })
    ).toMatchObject({
      actor: {
        actorType: "admin"
      }
    });

    expect(
      getSessionResponseSchema.parse({
        session: {
          id: "session_fixture",
          userId: "user_fixture",
          profileId: "profile_fixture",
          contractId: "contract_fixture",
          title: "Admin detail",
          objective: "Explain why the session ended",
          state: "failed",
          plannedRange: {
            startsAt: "2026-04-07T09:00:00.000Z",
            endsAt: "2026-04-07T10:00:00.000Z"
          },
          startedAt: "2026-04-07T09:00:00.000Z",
          endedAt: "2026-04-07T10:00:00.000Z",
          validMinutes: 20,
          invalidMinutes: 10,
          warningCount: 2,
          missedCheckpointCount: 2,
          finalArtifactRequired: true,
          createdAt: "2026-04-07T08:55:00.000Z",
          updatedAt: "2026-04-07T10:00:00.000Z"
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
      }).session.state
    ).toBe("failed");

    expect(
      getScoringResponseSchema.parse({
        scoring: {
          outcome: "failed",
          sessionScore: 48,
          components: {
            validTime: { raw: 40, weight: 0.35, weighted: 14 },
            process: { raw: 30, weight: 0.2, weighted: 6 },
            artifact: { raw: 50, weight: 0.25, weighted: 12.5 },
            knowledge: { raw: 80, weight: 0.2, weighted: 16 }
          },
          hardFailTriggered: true,
          hardFailReasons: ["insufficient_valid_time"],
          decisionTrace: {
            decidedByHardFail: true
          }
        }
      }).scoring?.outcome
    ).toBe("failed");

    expect(
      getEventsResponseSchema.parse({
        events: [
          {
            id: "event_1",
            sessionId: "session_fixture",
            type: "review_requested",
            actor: {
              actorType: "user",
              userId: "admin_fixture",
              label: "admin.dashboard"
            },
            state: "review_pending",
            occurredAt: "2026-04-07T10:00:00.000Z",
            details: {
              source: "admin"
            }
          }
        ]
      }).events
    ).toHaveLength(1);
  });
});
