import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { PromptTemplateRecord } from "@medstudy/ai-schemas";
import { PromptRenderer } from "../prompts/prompt-renderer";
import { OutputValidator } from "../validation/output-validator";
import { RetryPipeline } from "../validation/retry-pipeline";
import { AiProviderError } from "../types";

function createTemplate(): PromptTemplateRecord {
  return {
    key: "planning.session",
    version: "1.0.0",
    status: "active",
    description: "retry test",
    systemPrompt: "System",
    developerPrompt: "Developer",
    userPrompt: "Input {{value}}",
    inputSchema: z.object({
      value: z.string()
    }).strict()
  };
}

function createPipeline(overrides?: {
  complete?: ReturnType<typeof vi.fn>;
  save?: ReturnType<typeof vi.fn>;
}) {
  const provider = {
    complete: overrides?.complete ?? vi.fn()
  };
  const save = overrides?.save ?? vi.fn(async () => undefined);
  const pipeline = new RetryPipeline(
    {
      getProvider: () => provider,
      getDefaultConfig: () => ({
        model: "test-model",
        maxTokens: 1000,
        temperature: 0.2
      }),
      getAuditLevel: () => "minimal"
    } as never,
    {
      resolve: () => createTemplate()
    } as never,
    new PromptRenderer(),
    new OutputValidator(),
    {
      save
    } as never
  );

  return { pipeline, provider, save };
}

describe("RetryPipeline", () => {
  it("retries invalid output twice and succeeds on the third valid response", async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce({
        rawText: '{"wrong":"value"}',
        model: "test-model",
        inputTokens: 10,
        outputTokens: 5,
        latencyMs: 20,
        requestId: "request_1"
      })
      .mockResolvedValueOnce({
        rawText: '{"stillWrong":"value"}',
        model: "test-model",
        inputTokens: 11,
        outputTokens: 6,
        latencyMs: 21,
        requestId: "request_1"
      })
      .mockResolvedValueOnce({
        rawText: '{"value":"ok"}',
        model: "test-model",
        inputTokens: 12,
        outputTokens: 7,
        latencyMs: 22,
        requestId: "request_1"
      });
    const { pipeline, provider } = createPipeline({ complete });
    const sleepSpy = vi
      .spyOn(pipeline as never, "sleep")
      .mockResolvedValue(undefined);

    const result = await pipeline.execute({
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      inputSchema: z.object({ value: z.string() }),
      outputSchema: z.object({ value: z.string() }).strict(),
      input: { value: "hello" }
    });

    expect(result).toMatchObject({
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      attemptCount: 3,
      data: { value: "ok" }
    });
    expect(provider.complete).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(2);
  });

  it("retries a transient provider error and then succeeds", async () => {
    const complete = vi
      .fn()
      .mockRejectedValueOnce(
        new AiProviderError("rate_limit", "Too many requests", true, 429)
      )
      .mockResolvedValueOnce({
        rawText: '{"value":"ok"}',
        model: "test-model",
        inputTokens: 10,
        outputTokens: 5,
        latencyMs: 20,
        requestId: "request_1"
      });
    const { pipeline, provider } = createPipeline({ complete });
    const sleepSpy = vi
      .spyOn(pipeline as never, "sleep")
      .mockResolvedValue(undefined);

    const result = await pipeline.execute({
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      inputSchema: z.object({ value: z.string() }),
      outputSchema: z.object({ value: z.string() }).strict(),
      input: { value: "hello" }
    });

    expect(result).toMatchObject({
      attemptCount: 2,
      data: { value: "ok" }
    });
    expect(provider.complete).toHaveBeenCalledTimes(2);
    expect(sleepSpy).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-retryable provider failures", async () => {
    const complete = vi.fn().mockRejectedValue(
      new AiProviderError("auth", "Unauthorized", false, 401)
    );
    const { pipeline, provider } = createPipeline({ complete });

    const result = await pipeline.execute({
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      inputSchema: z.object({ value: z.string() }),
      outputSchema: z.object({ value: z.string() }).strict(),
      input: { value: "hello" }
    });

    expect(result).toEqual(
      expect.objectContaining({
        attemptCount: 1,
        lastError: "Unauthorized"
      })
    );
    expect(provider.complete).toHaveBeenCalledTimes(1);
  });

  it("returns a typed failure when retries are exhausted", async () => {
    const complete = vi.fn().mockResolvedValue({
      rawText: '{"wrong":"value"}',
      model: "test-model",
      inputTokens: 10,
      outputTokens: 5,
      latencyMs: 20,
      requestId: "request_1"
    });
    const { pipeline, provider } = createPipeline({ complete });
    vi.spyOn(pipeline as never, "sleep").mockResolvedValue(undefined);

    const result = await pipeline.execute({
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      inputSchema: z.object({ value: z.string() }),
      outputSchema: z.object({ value: z.string() }).strict(),
      input: { value: "hello" },
      retryOptions: { maxAttempts: 2 }
    });

    expect(result).toEqual(
      expect.objectContaining({
        attemptCount: 2,
        lastError: "Model output JSON failed schema validation."
      })
    );
    expect(provider.complete).toHaveBeenCalledTimes(2);
  });

  it("adds a correction hint after validation failure", async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce({
        rawText: '{"wrong":"value"}',
        model: "test-model",
        inputTokens: 10,
        outputTokens: 5,
        latencyMs: 20,
        requestId: "request_1"
      })
      .mockResolvedValueOnce({
        rawText: '{"value":"ok"}',
        model: "test-model",
        inputTokens: 11,
        outputTokens: 6,
        latencyMs: 21,
        requestId: "request_1"
      });
    const { pipeline, provider } = createPipeline({ complete });
    vi.spyOn(pipeline as never, "sleep").mockResolvedValue(undefined);

    await pipeline.execute({
      capabilityKey: "planning.session",
      promptKey: "planning.session",
      inputSchema: z.object({ value: z.string() }),
      outputSchema: z.object({ value: z.string() }).strict(),
      input: { value: "hello" }
    });

    expect(provider.complete).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        developerPrompt: expect.stringContaining(
          "Previous response failed schema validation."
        )
      })
    );
  });
});
