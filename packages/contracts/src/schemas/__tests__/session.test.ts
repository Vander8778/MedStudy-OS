import { describe, expect, it } from "vitest";
import { sessionSchema } from "../session";

describe("sessionSchema", () => {
  it("accepts a canonical session payload", () => {
    const parsed = sessionSchema.parse({
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Cardiology review",
      objective: "Complete a focused revision block",
      state: "active_valid",
      plannedRange: {
        startsAt: "2026-03-23T09:00:00+03:00",
        endsAt: "2026-03-23T11:00:00+03:00"
      },
      validMinutes: 90,
      invalidMinutes: 5,
      warningCount: 1,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      blockIds: ["block_1"],
      checkpointIds: ["checkpoint_1"],
      artifactIds: ["artifact_1"],
      evaluationIds: ["evaluation_1"],
      vivaAttemptIds: ["viva_1"],
      penaltyIds: [],
      createdAt: "2026-03-23T08:55:00+03:00",
      updatedAt: "2026-03-23T10:15:00+03:00"
    });

    expect(parsed.state).toBe("active_valid");
  });

  it("rejects unknown session states", () => {
    const result = sessionSchema.safeParse({
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Cardiology review",
      objective: "Complete a focused revision block",
      state: "unknown_state",
      plannedRange: {
        startsAt: "2026-03-23T09:00:00+03:00",
        endsAt: "2026-03-23T11:00:00+03:00"
      },
      validMinutes: 90,
      invalidMinutes: 5,
      warningCount: 1,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      blockIds: [],
      checkpointIds: [],
      artifactIds: [],
      evaluationIds: [],
      vivaAttemptIds: [],
      penaltyIds: [],
      createdAt: "2026-03-23T08:55:00+03:00",
      updatedAt: "2026-03-23T10:15:00+03:00"
    });

    expect(result.success).toBe(false);
  });
});
