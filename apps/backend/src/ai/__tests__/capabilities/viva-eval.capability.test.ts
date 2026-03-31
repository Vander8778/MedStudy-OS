import { describe, expect, it, vi } from "vitest";
import { VivaEvaluationCapability } from "../../capabilities/viva-eval.capability";

function createVivaInput() {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Viva review",
      objective: "Assess understanding",
      state: "review_pending",
      plannedRange: {
        startsAt: "2026-03-31T09:00:00.000Z",
        endsAt: "2026-03-31T10:00:00.000Z"
      },
      validMinutes: 50,
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
    vivaAttempt: {
      id: "viva_1",
      sessionId: "session_1",
      status: "failed",
      score: 60,
      passingScore: 70,
      createdAt: "2026-03-31T09:45:00.000Z",
      updatedAt: "2026-03-31T09:45:00.000Z"
    },
    transcript: "Question and answer transcript",
    rubric: {
      criteria: [
        {
          key: "reasoning",
          label: "Reasoning",
          description: "Clinical reasoning quality",
          weight: 1
        }
      ],
      passingScore: 70
    },
    focusTopics: ["cardiology"],
    previousNotes: []
  };
}

describe("VivaEvaluationCapability", () => {
  it("uses the viva evaluation prompt key and can return typed failure", async () => {
    const retryPipeline = {
      execute: vi.fn(async (request) => {
        expect(request.promptKey).toBe("evaluation.viva");

        return {
          capabilityKey: "evaluation.viva",
          promptKey: "evaluation.viva",
          requestId: "request_1",
          attemptCount: 2,
          lastError: "Model output JSON failed schema validation."
        };
      })
    };
    const capability = new VivaEvaluationCapability(retryPipeline as never);

    const result = await capability.execute(createVivaInput());

    expect(retryPipeline.execute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      capabilityKey: "evaluation.viva",
      lastError: "Model output JSON failed schema validation."
    });
  });
});
