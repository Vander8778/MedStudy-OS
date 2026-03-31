import { describe, expect, it, vi } from "vitest";
import { PlanningCapability } from "../capabilities/planning.capability";
import { CapabilityRegistry } from "../capabilities/capability-registry";
import { PromptRegistryService } from "../prompts/prompt-registry.service";
import { PromptRenderer } from "../prompts/prompt-renderer";
import { OutputValidator } from "../validation/output-validator";
import { RetryPipeline } from "../validation/retry-pipeline";
import { AiService } from "../ai.service";

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

describe("AiService", () => {
  it("executes a capability end-to-end with a mocked provider and audit log", async () => {
    const auditLogRepository = {
      save: vi.fn(async () => undefined)
    };
    const retryPipeline = new RetryPipeline(
      {
        getProvider: () => ({
          complete: vi.fn(async () => ({
            rawText: JSON.stringify({
              recommendedTitle: "Cardiology review plan",
              objectiveSummary: "Focus on core concepts",
              agenda: [
                {
                  title: "Review notes",
                  durationMinutes: 30,
                  rationale: "Refresh the topic"
                }
              ],
              checkpointFocusAreas: ["ECG interpretation"],
              riskFlags: [],
              coachingNotes: ["Keep artifact concise"]
            }),
            model: "mock-model",
            inputTokens: 20,
            outputTokens: 30,
            latencyMs: 40,
            requestId: "request_1"
          }))
        }),
        getDefaultConfig: () => ({
          model: "mock-model",
          maxTokens: 1000,
          temperature: 0.2
        }),
        getAuditLevel: () => "minimal"
      } as never,
      new PromptRegistryService(),
      new PromptRenderer(),
      new OutputValidator(),
      auditLogRepository as never
    );
    const planningCapability = new PlanningCapability(retryPipeline);
    const registry = new CapabilityRegistry(
      planningCapability,
      { key: "generation.checkpoint" } as never,
      { key: "evaluation.artifact" } as never,
      { key: "evaluation.viva" } as never,
      { key: "summary.session" } as never
    );
    const service = new AiService(registry);

    const result = await service.execute(
      "planning.session",
      createPlanningInput()
    );

    expect(result).toMatchObject({
      status: "succeeded",
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      model: "mock-model",
      data: {
        recommendedTitle: "Cardiology review plan"
      }
    });
    expect(auditLogRepository.save).toHaveBeenCalledTimes(1);
  });
});
