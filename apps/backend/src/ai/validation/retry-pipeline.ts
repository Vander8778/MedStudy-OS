import { Injectable } from "@nestjs/common";
import { createId } from "../../common/backend-utils";
import { AiRequestLogRepository } from "../audit/ai-request-log.repository";
import { PromptRegistryService } from "../prompts/prompt-registry.service";
import { PromptRenderer } from "../prompts/prompt-renderer";
import { ProviderRegistry } from "../providers/provider-registry";
import {
  AiProviderError,
  type AiAuditLevel,
  type AiCapabilityFailure,
  type AiCapabilityResult,
  type ExecuteCapabilityRequest
} from "../types";
import { OutputValidator } from "./output-validator";

@Injectable()
export class RetryPipeline {
  constructor(
    private readonly providerRegistry: ProviderRegistry,
    private readonly promptRegistry: PromptRegistryService,
    private readonly promptRenderer: PromptRenderer,
    private readonly outputValidator: OutputValidator,
    private readonly aiRequestLogRepository: AiRequestLogRepository
  ) {}

  protected async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractSessionId(input: unknown): string | undefined {
    if (!input || typeof input !== "object") {
      return undefined;
    }

    const candidate = input as {
      sessionId?: unknown;
      session?: { id?: unknown };
    };

    if (typeof candidate.sessionId === "string") {
      return candidate.sessionId;
    }

    return typeof candidate.session?.id === "string"
      ? candidate.session.id
      : undefined;
  }

  private extractUserId(input: unknown): string | undefined {
    if (!input || typeof input !== "object") {
      return undefined;
    }

    const candidate = input as {
      userId?: unknown;
      session?: { userId?: unknown };
    };

    if (typeof candidate.userId === "string") {
      return candidate.userId;
    }

    return typeof candidate.session?.userId === "string"
      ? candidate.session.userId
      : undefined;
  }

  private summarizeInput(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {
        type: typeof value
      };
    }

    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (key === "sessionId" || key === "userId") {
        result[key] = entry;
        continue;
      }

      if (typeof entry === "string") {
        result[key] = {
          type: "string",
          length: entry.length
        };
        continue;
      }

      if (Array.isArray(entry)) {
        result[key] = {
          type: "array",
          length: entry.length
        };
        continue;
      }

      if (entry && typeof entry === "object") {
        result[key] = {
          type: "object",
          keys: Object.keys(entry as Record<string, unknown>)
        };
        continue;
      }

      result[key] = entry;
    }

    return result;
  }

  private buildFailure(
    requestId: string,
    capabilityKey: string,
    promptKey: string,
    promptVersion: string | undefined,
    attemptCount: number,
    lastError: string,
    lastValidationErrors?: unknown
  ): AiCapabilityFailure {
    return {
      status: "failed",
      capabilityKey,
      promptKey,
      promptVersion,
      requestId,
      attemptCount,
      lastError,
      lastValidationErrors
    };
  }

  private appendCorrectionHint(
    developerPrompt: string | undefined,
    validationErrors: unknown
  ) {
    const correctionHint = [
      "Previous response failed schema validation.",
      "Return only corrected JSON that matches the required shape.",
      `Validation issues: ${JSON.stringify(validationErrors)}`
    ].join("\n");

    return developerPrompt
      ? `${developerPrompt}\n\n${correctionHint}`
      : correctionHint;
  }

  private shouldStoreRawOutput(auditLevel: AiAuditLevel) {
    return auditLevel === "full";
  }

  async execute<TInput, TOutput>(
    request: ExecuteCapabilityRequest<TInput, TOutput>
  ): Promise<AiCapabilityResult<TOutput> | AiCapabilityFailure> {
    const requestId = createId("ai_request");
    const auditLevel = this.providerRegistry.getAuditLevel();
    const parsedInput = request.inputSchema.safeParse(request.input);

    if (!parsedInput.success) {
      const failure = this.buildFailure(
        requestId,
        request.capabilityKey,
        request.promptKey,
        undefined,
        0,
        "Capability input validation failed.",
        parsedInput.error.issues
      );

      await this.aiRequestLogRepository.save({
        requestId,
        capabilityKey: request.capabilityKey,
        promptKey: request.promptKey,
        promptVersion: "unresolved",
        model: "unresolved",
        inputSummary: this.summarizeInput(request.input),
        status: "failed",
        attemptCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalLatencyMs: 0,
        sessionId: this.extractSessionId(request.input),
        userId: this.extractUserId(request.input)
      });

      return failure;
    }

    const prompt = this.promptRegistry.resolve(request.promptKey);

    if (!prompt) {
      const failure = this.buildFailure(
        requestId,
        request.capabilityKey,
        request.promptKey,
        undefined,
        0,
        `Prompt template not found for key ${request.promptKey}.`
      );

      await this.aiRequestLogRepository.save({
        requestId,
        capabilityKey: request.capabilityKey,
        promptKey: request.promptKey,
        promptVersion: "unresolved",
        model: "unresolved",
        inputSummary: this.summarizeInput(parsedInput.data),
        status: "failed",
        attemptCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalLatencyMs: 0,
        sessionId: this.extractSessionId(parsedInput.data),
        userId: this.extractUserId(parsedInput.data)
      });

      return failure;
    }

    const provider = this.providerRegistry.getProvider(
      request.providerKey ?? "anthropic"
    );
    const providerConfig = {
      ...this.providerRegistry.getDefaultConfig(request.capabilityKey),
      ...request.providerConfig
    };
    const maxAttempts = request.retryOptions?.maxAttempts ?? 3;
    const baseDelayMs = request.retryOptions?.baseDelayMs ?? 500;
    const backoffMultiplier = request.retryOptions?.backoffMultiplier ?? 2;
    const enableCorrectionHint = request.retryOptions?.correctionHint ?? true;
    const rendered = this.promptRenderer.render<TInput>(prompt, parsedInput.data);
    let attemptCount = 0;
    let totalLatencyMs = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let lastError = "AI execution failed.";
    let lastValidationErrors: unknown;
    let lastRawOutput: string | undefined;
    let correctionHintErrors: unknown;

    if (!rendered.ok) {
      const failure = this.buildFailure(
        requestId,
        request.capabilityKey,
        request.promptKey,
        prompt.version,
        1,
        rendered.error,
        rendered.issues
      );

      await this.aiRequestLogRepository.save({
        requestId,
        capabilityKey: request.capabilityKey,
        promptKey: request.promptKey,
        promptVersion: prompt.version,
        model: providerConfig.model,
        inputSummary: this.summarizeInput(parsedInput.data),
        status: "failed",
        attemptCount: 1,
        inputTokens,
        outputTokens,
        totalLatencyMs,
        sessionId: this.extractSessionId(parsedInput.data),
        userId: this.extractUserId(parsedInput.data)
      });

      return failure;
    }

    while (attemptCount < maxAttempts) {
      attemptCount += 1;

      try {
        const response = await provider.complete({
          requestId,
          systemPrompt: rendered.systemPrompt,
          developerPrompt: correctionHintErrors
            ? this.appendCorrectionHint(
                rendered.developerPrompt,
                correctionHintErrors
              )
            : rendered.developerPrompt,
          userPrompt: rendered.userPrompt,
          config: providerConfig
        });

        totalLatencyMs += response.latencyMs;
        inputTokens += response.inputTokens;
        outputTokens += response.outputTokens;
        lastRawOutput = response.rawText;

        const validated = this.outputValidator.validate(
          response.rawText,
          request.outputSchema
        );

        if (validated.ok) {
          const result: AiCapabilityResult<TOutput> = {
            status: "succeeded",
            capabilityKey: request.capabilityKey,
            promptKey: request.promptKey,
            promptVersion: prompt.version,
            model: response.model,
            requestId,
            attemptCount,
            data: validated.data,
            inputTokens,
            outputTokens,
            totalLatencyMs
          };

          try {
            await this.aiRequestLogRepository.save({
              requestId,
              capabilityKey: request.capabilityKey,
              promptKey: request.promptKey,
              promptVersion: prompt.version,
              model: response.model,
              inputSummary: this.summarizeInput(parsedInput.data),
              validatedOutput: validated.parsedJson,
              rawOutput: this.shouldStoreRawOutput(auditLevel)
                ? response.rawText
                : undefined,
              status: "succeeded",
              attemptCount,
              inputTokens,
              outputTokens,
              totalLatencyMs,
              sessionId: this.extractSessionId(parsedInput.data),
              userId: this.extractUserId(parsedInput.data)
            });
          } catch {
            // Best-effort audit persistence on success: the validated AI output is still
            // returned so orchestration does not lose a usable result due to audit failure.
          }

          return result;
        }

        lastError = validated.error;
        lastValidationErrors = validated.validationErrors;
        correctionHintErrors = validated.validationErrors;

        if (attemptCount >= maxAttempts || !enableCorrectionHint) {
          break;
        }
      } catch (error) {
        const providerError =
          error instanceof AiProviderError
            ? error
            : new AiProviderError(
                "unknown",
                "Unknown AI provider failure.",
                false,
                undefined,
                { cause: error }
              );

        lastError = providerError.message;

        if (!providerError.retryable || attemptCount >= maxAttempts) {
          break;
        }
      }

      const delayMs =
        baseDelayMs * backoffMultiplier ** Math.max(attemptCount - 1, 0);
      await this.sleep(delayMs);
    }

    const failure = this.buildFailure(
      requestId,
      request.capabilityKey,
      request.promptKey,
      prompt.version,
      attemptCount,
      lastError,
      lastValidationErrors
    );

    await this.aiRequestLogRepository.save({
      requestId,
      capabilityKey: request.capabilityKey,
      promptKey: request.promptKey,
      promptVersion: prompt.version,
      model: providerConfig.model,
      inputSummary: this.summarizeInput(parsedInput.data),
      rawOutput: this.shouldStoreRawOutput(auditLevel) ? lastRawOutput : undefined,
      status: "failed",
      attemptCount,
      inputTokens,
      outputTokens,
      totalLatencyMs,
      sessionId: this.extractSessionId(parsedInput.data),
      userId: this.extractUserId(parsedInput.data)
    });

    return failure;
  }
}
