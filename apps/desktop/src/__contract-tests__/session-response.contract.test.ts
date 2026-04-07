import { describe, expect, it } from "vitest";
import { getSessionResponseSchema } from "@medstudy/contracts";

describe("desktop session response contract compliance", () => {
  it("parses non-terminal and terminal session states used by desktop reconciliation", () => {
    const base = {
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
    };

    expect(
      getSessionResponseSchema.parse({
        ...base,
        session: {
          id: "session_active",
          userId: "user_fixture",
          profileId: "profile_fixture",
          contractId: "contract_fixture",
          title: "Desktop active",
          objective: "Stay in sync",
          state: "active_warning",
          plannedRange: {
            startsAt: "2026-04-07T09:00:00.000Z",
            endsAt: "2026-04-07T10:00:00.000Z"
          },
          validMinutes: 20,
          invalidMinutes: 5,
          warningCount: 1,
          missedCheckpointCount: 0,
          finalArtifactRequired: true,
          createdAt: "2026-04-07T08:55:00.000Z",
          updatedAt: "2026-04-07T09:20:00.000Z"
        }
      }).session.state
    ).toBe("active_warning");

    expect(
      getSessionResponseSchema.parse({
        ...base,
        session: {
          id: "session_completed",
          userId: "user_fixture",
          profileId: "profile_fixture",
          contractId: "contract_fixture",
          title: "Desktop completed",
          objective: "Show final outcome",
          state: "completed",
          plannedRange: {
            startsAt: "2026-04-07T09:00:00.000Z",
            endsAt: "2026-04-07T10:00:00.000Z"
          },
          startedAt: "2026-04-07T09:00:00.000Z",
          endedAt: "2026-04-07T10:00:00.000Z",
          validMinutes: 60,
          invalidMinutes: 0,
          warningCount: 0,
          missedCheckpointCount: 0,
          finalArtifactRequired: true,
          createdAt: "2026-04-07T08:55:00.000Z",
          updatedAt: "2026-04-07T10:00:00.000Z"
        }
      }).session.state
    ).toBe("completed");
  });
});
