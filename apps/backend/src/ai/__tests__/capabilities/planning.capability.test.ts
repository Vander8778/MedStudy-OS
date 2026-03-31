import { describe, expect, it, vi } from "vitest";
import { PlanningCapability } from "../../capabilities/planning.capability";

function createPlanningInput() {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Focused review",
      objective: "Review cardiology notes",
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
    learnerProfile: {
      studyStage: "clinical",
      focusTopics: ["cardiology"],
      constraints: ["one-hour window"]
    },
    recentSummaries: []
  };
}

describe("PlanningCapability", () => {
  it("uses the planning prompt key and schemas and returns typed success", async () => {
    const retryPipeline = {
      execute: vi.fn(async (request) => {
        expect(request.promptKey).toBe("planning.session");
        expect(request.inputSchema.safeParse(createPlanningInput()).success).toBe(true);
        expect(
          request.outputSchema.safeParse({
            recommendedTitle: "Plan",
            objectiveSummary: "Summary",
            agenda: [
              {
                title: "Study",
                durationMinutes: 30,
                rationale: "Focus"
              }
            ],
            checkpointFocusAreas: [],
            riskFlags: [],
            coachingNotes: []
          }).success
        ).toBe(true);

        return {
          capabilityKey: "planning.session",
          promptKey: "planning.session",
          promptVersion: "1.0.0",
          model: "mock-model",
          requestId: "request_1",
          attemptCount: 1,
          data: {
            recommendedTitle: "Plan",
            objectiveSummary: "Summary",
            agenda: [
              {
                title: "Study",
                durationMinutes: 30,
                rationale: "Focus"
              }
            ],
            checkpointFocusAreas: [],
            riskFlags: [],
            coachingNotes: []
          },
          inputTokens: 1,
          outputTokens: 1,
          totalLatencyMs: 1
        };
      })
    };
    const capability = new PlanningCapability(retryPipeline as never);

    const result = await capability.execute(createPlanningInput());

    expect(retryPipeline.execute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      capabilityKey: "planning.session",
      data: {
        recommendedTitle: "Plan"
      }
    });
  });

  it("surfaces typed failure for invalid planning input", async () => {
    const retryPipeline = {
      execute: vi.fn(async (request) => {
        const parsed = request.inputSchema.safeParse(request.input);

        if (!parsed.success) {
          return {
            capabilityKey: request.capabilityKey,
            promptKey: request.promptKey,
            requestId: "request_1",
            attemptCount: 0,
            lastError: "Capability input validation failed.",
            lastValidationErrors: parsed.error.issues
          };
        }

        throw new Error("expected invalid input");
      })
    };
    const capability = new PlanningCapability(retryPipeline as never);

    const result = await capability.execute({
      ...createPlanningInput(),
      session: {
        ...createPlanningInput().session,
        title: ""
      }
    } as never);

    expect(result).toMatchObject({
      lastError: "Capability input validation failed."
    });
  });
});
