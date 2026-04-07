import { describe, expect, it, vi } from "vitest";
import { PromptRegistryService } from "../ai/prompts/prompt-registry.service";
import { PromptRenderer } from "../ai/prompts/prompt-renderer";
import { OutputValidator } from "../ai/validation/output-validator";
import { RetryPipeline } from "../ai/validation/retry-pipeline";
import { buildTelemetryBatch } from "../__fixtures__/telemetry.factory";
import { createTelemetryIntegrationHarness } from "./helpers";

describe("malformed input integration", () => {
  it("returns structured rejection for malformed telemetry payloads", async () => {
    const harness = createTelemetryIntegrationHarness();

    const result = await harness.processor.ingestBatch(
      buildTelemetryBatch({
        events: [
          {
            type: "not_a_real_event" as never
          }
        ]
      })
    );

    expect(result.acceptedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.results[0]?.accepted).toBe(false);
    expect(result.results[0]?.error).toContain("Invalid enum value");
  });

  it("rejects malformed AI capability input without promoting bad output to authority", async () => {
    const auditLogRepository = {
      save: vi.fn(async () => undefined)
    };
    const pipeline = new RetryPipeline(
      {
        getProvider: () => ({
          complete: vi.fn(async () => ({
            rawText: '{"recommendedTitle":7}',
            model: "mock-model",
            inputTokens: 1,
            outputTokens: 1,
            latencyMs: 1,
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

    const invalidInput = await pipeline.execute({
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      inputSchema: {
        safeParse: () => ({
          success: false,
          error: { issues: [{ message: "bad input" }] }
        })
      } as never,
      outputSchema: { safeParse: () => ({ success: true, data: {} }) } as never,
      input: {}
    });

    expect(invalidInput).toMatchObject({
      status: "failed",
      lastError: "Capability input validation failed."
    });
    expect(auditLogRepository.save).toHaveBeenCalledTimes(1);
  });
});
