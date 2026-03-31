import { describe, expect, it, vi } from "vitest";
import { CheckpointGenerationCapability } from "../../capabilities/checkpoint-gen.capability";

function createCheckpointInput() {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Checkpoint planning",
      objective: "Break the session into milestones",
      state: "planned",
      plannedRange: {
        startsAt: "2026-03-31T09:00:00.000Z",
        endsAt: "2026-03-31T10:00:00.000Z"
      },
      validMinutes: 0,
      invalidMinutes: 0,
      warningCount: 0,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      createdAt: "2026-03-31T08:50:00.000Z",
      updatedAt: "2026-03-31T08:50:00.000Z"
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
    desiredCheckpointCount: 2,
    focusTopics: ["cardiology"],
    existingCheckpoints: []
  };
}

describe("CheckpointGenerationCapability", () => {
  it("delegates to the retry pipeline with the checkpoint prompt key", async () => {
    const retryPipeline = {
      execute: vi.fn(async (request) => {
        expect(request.capabilityKey).toBe("generation.checkpoint");
        expect(request.promptKey).toBe("generation.checkpoint");
        expect(request.inputSchema.safeParse(createCheckpointInput()).success).toBe(
          true
        );
        expect(
          request.outputSchema.safeParse({
            checkpoints: [
              {
                title: "Checkpoint 1",
                rationale: "Validate progress",
                suggestedOffsetMinutes: 20,
                verificationPrompt: "Summarize the main concept learned so far.",
                mandatoryArtifactTypes: ["final_submission"]
              }
            ]
          }).success
        ).toBe(true);

        return {
          status: "succeeded",
          capabilityKey: "generation.checkpoint",
          promptKey: "generation.checkpoint",
          promptVersion: "1.0.0",
          model: "mock-model",
          requestId: "request_1",
          attemptCount: 1,
          data: {
            checkpoints: [
              {
                title: "Checkpoint 1",
                rationale: "Validate progress",
                suggestedOffsetMinutes: 20,
                verificationPrompt: "Summarize the main concept learned so far.",
                mandatoryArtifactTypes: ["final_submission"]
              }
            ]
          },
          inputTokens: 1,
          outputTokens: 1,
          totalLatencyMs: 1
        };
      })
    };
    const capability = new CheckpointGenerationCapability(
      retryPipeline as never
    );

    const result = await capability.execute(createCheckpointInput());

    expect(retryPipeline.execute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "succeeded",
      capabilityKey: "generation.checkpoint",
      data: {
        checkpoints: [
          {
            title: "Checkpoint 1"
          }
        ]
      }
    });
  });
});
