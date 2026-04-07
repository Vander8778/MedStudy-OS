import { describe, expect, it, vi } from "vitest";
import { AiService } from "../ai/ai.service";
import { PlanningCapability } from "../ai/capabilities/planning.capability";
import { CapabilityRegistry } from "../ai/capabilities/capability-registry";
import { PromptRegistryService } from "../ai/prompts/prompt-registry.service";
import { PromptRenderer } from "../ai/prompts/prompt-renderer";
import { OutputValidator } from "../ai/validation/output-validator";
import { RetryPipeline } from "../ai/validation/retry-pipeline";
import { AiProviderError } from "../ai/types";

function createPlanningInput() {
  return {
    session: {
      id: "session_fixture",
      userId: "user_fixture",
      profileId: "profile_fixture",
      contractId: "contract_fixture",
      title: "AI planning integration",
      objective: "Validate retry and fallback paths",
      state: "planned",
      plannedRange: {
        startsAt: "2026-04-07T09:00:00.000Z",
        endsAt: "2026-04-07T10:00:00.000Z"
      },
      validMinutes: 0,
      invalidMinutes: 0,
      warningCount: 0,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      createdAt: "2026-04-07T08:55:00.000Z",
      updatedAt: "2026-04-07T08:55:00.000Z"
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
    learnerProfile: {
      studyStage: "clinical",
      focusTopics: ["cardiology"],
      constraints: ["one-hour window"]
    },
    recentSummaries: []
  };
}

function createAiServiceWithProvider(
  complete: (requestId: string) => Promise<{
    rawText: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    requestId: string;
  }>
) {
  const auditLogRepository = {
    save: vi.fn(async () => undefined)
  };
  const provider = {
    complete: vi.fn((request: { requestId: string }) => complete(request.requestId))
  };
  class ImmediateRetryPipeline extends RetryPipeline {
    protected override async sleep() {
      return undefined;
    }
  }

  const retryPipeline = new ImmediateRetryPipeline(
    {
      getProvider: () => provider,
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

  return {
    service: new AiService(registry),
    provider,
    auditLogRepository
  };
}

describe("AI service fallback integration", () => {
  it("retries malformed provider output until a validated response succeeds", async () => {
    let callCount = 0;
    const { service, provider, auditLogRepository } = createAiServiceWithProvider(
      async (requestId) => {
        callCount += 1;
        return {
          rawText:
            callCount === 1
              ? '{"recommendedTitle":7}'
              : JSON.stringify({
                  recommendedTitle: "Recovered plan",
                  objectiveSummary: "Valid JSON after schema retry",
                  agenda: [
                    {
                      title: "Review",
                      durationMinutes: 30,
                      rationale: "Stay focused"
                    }
                  ],
                  checkpointFocusAreas: ["ECG"],
                  riskFlags: [],
                  coachingNotes: ["Keep it concise"]
                }),
          model: "mock-model",
          inputTokens: 10,
          outputTokens: 20,
          latencyMs: 5,
          requestId
        };
      }
    );

    const result = await service.execute("planning.session", createPlanningInput());

    expect(result).toMatchObject({
      status: "succeeded",
      attemptCount: 2
    });
    expect(provider.complete).toHaveBeenCalledTimes(2);
    expect(auditLogRepository.save).toHaveBeenCalledTimes(1);
  });

  it("fails explicitly when the provider keeps timing out", async () => {
    const { service, provider } = createAiServiceWithProvider(async () => {
      throw new AiProviderError("timeout", "Provider timed out.", true);
    });

    const result = await service.execute("planning.session", createPlanningInput());

    expect(result).toMatchObject({
      status: "failed",
      attemptCount: 3,
      lastError: "Provider timed out."
    });
    expect(provider.complete).toHaveBeenCalledTimes(3);
  });
});
