import { describe, expect, it, vi } from "vitest";
import { SessionSummaryCapability } from "../../capabilities/summary.capability";

function createSummaryInput() {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Session summary",
      objective: "Reflect on the study block",
      state: "review_pending",
      plannedRange: {
        startsAt: "2026-03-31T09:00:00.000Z",
        endsAt: "2026-03-31T10:00:00.000Z"
      },
      startedAt: "2026-03-31T09:00:00.000Z",
      endedAt: "2026-03-31T10:00:00.000Z",
      reviewRequestedAt: "2026-03-31T10:00:00.000Z",
      validMinutes: 55,
      invalidMinutes: 5,
      warningCount: 1,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      createdAt: "2026-03-31T08:50:00.000Z",
      updatedAt: "2026-03-31T10:00:00.000Z"
    },
    contract: {
      id: "contract_1",
      userId: "user_1",
      name: "Core contract",
      status: "active",
      terms: {
        minValidMinutes: 45,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70
      },
      activeRange: {
        startsAt: "2026-03-31T00:00:00.000Z",
        endsAt: "2026-04-30T00:00:00.000Z"
      },
      tags: ["focus"],
      createdAt: "2026-03-30T08:00:00.000Z",
      updatedAt: "2026-03-30T08:00:00.000Z"
    },
    checkpoints: [],
    artifacts: [],
    vivaAttempts: [],
    penalties: [],
    additionalNotes: ""
  };
}

describe("SessionSummaryCapability", () => {
  it("delegates to the retry pipeline with the session summary prompt key", async () => {
    const retryPipeline = {
      execute: vi.fn(async (request) => {
        expect(request.capabilityKey).toBe("summary.session");
        expect(request.promptKey).toBe("summary.session");
        expect(request.inputSchema.safeParse(createSummaryInput()).success).toBe(
          true
        );
        expect(
          request.outputSchema.safeParse({
            narrativeSummary: "The learner completed a focused study session.",
            achievements: ["Completed the planned study window"],
            concerns: [],
            followUpActions: ["Prepare the final artifact"],
            recommendedNextStep: "Submit the final summary artifact."
          }).success
        ).toBe(true);

        return {
          status: "succeeded",
          capabilityKey: "summary.session",
          promptKey: "summary.session",
          promptVersion: "1.0.0",
          model: "mock-model",
          requestId: "request_1",
          attemptCount: 1,
          data: {
            narrativeSummary: "The learner completed a focused study session.",
            achievements: ["Completed the planned study window"],
            concerns: [],
            followUpActions: ["Prepare the final artifact"],
            recommendedNextStep: "Submit the final summary artifact."
          },
          inputTokens: 1,
          outputTokens: 1,
          totalLatencyMs: 1
        };
      })
    };
    const capability = new SessionSummaryCapability(retryPipeline as never);

    const result = await capability.execute(createSummaryInput());

    expect(retryPipeline.execute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "succeeded",
      capabilityKey: "summary.session",
      data: {
        recommendedNextStep: "Submit the final summary artifact."
      }
    });
  });
});
