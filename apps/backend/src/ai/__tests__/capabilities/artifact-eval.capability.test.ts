import { describe, expect, it, vi } from "vitest";
import { ArtifactEvaluationCapability } from "../../capabilities/artifact-eval.capability";

function createArtifactInput() {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Artifact review",
      objective: "Review summary",
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
    artifact: {
      id: "artifact_1",
      sessionId: "session_1",
      type: "final_submission",
      source: "manual_entry",
      status: "submitted",
      title: "Session summary",
      isMandatory: true,
      createdAt: "2026-03-31T09:45:00.000Z",
      updatedAt: "2026-03-31T09:45:00.000Z"
    },
    artifactText: "Detailed artifact text",
    rubric: {
      criteria: [
        {
          key: "accuracy",
          label: "Accuracy",
          description: "Factually correct",
          weight: 1
        }
      ]
    },
    checkpointContext: null
  };
}

describe("ArtifactEvaluationCapability", () => {
  it("uses the artifact evaluation prompt key and returns typed success", async () => {
    const retryPipeline = {
      execute: vi.fn(async (request) => {
        expect(request.promptKey).toBe("evaluation.artifact");

        return {
          capabilityKey: "evaluation.artifact",
          promptKey: "evaluation.artifact",
          promptVersion: "1.0.0",
          model: "mock-model",
          requestId: "request_1",
          attemptCount: 1,
          data: {
            summary: "Strong artifact",
            overallScore: 88,
            rubricScores: [
              {
                criterionKey: "accuracy",
                score: 88,
                justification: "Mostly correct"
              }
            ],
            strengths: ["Clear structure"],
            concerns: [],
            recommendedFollowUp: ["Tighten citations"],
            confidence: "medium"
          },
          inputTokens: 1,
          outputTokens: 1,
          totalLatencyMs: 1
        };
      })
    };
    const capability = new ArtifactEvaluationCapability(retryPipeline as never);

    const result = await capability.execute(createArtifactInput());

    expect(retryPipeline.execute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      capabilityKey: "evaluation.artifact",
      data: {
        overallScore: 88
      }
    });
  });
});
