import { Injectable } from "@nestjs/common";
import { getEnv } from "../../config/env";
import type { AiProvider } from "./ai-provider.interface";
import {
  AiProviderError,
  type AiCompletionRequest,
  type AiCompletionResponse
} from "../types";

type AnthropicClient = {
  messages: {
    create(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
};

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly key = "anthropic" as const;
  private client?: AnthropicClient;

  private getClient(): AnthropicClient {
    if (this.client) {
      return this.client;
    }

    const apiKey = getEnv().anthropicApiKey;

    if (!apiKey) {
      throw new AiProviderError(
        "config",
        "ANTHROPIC_API_KEY is not configured.",
        false,
        undefined
      );
    }

    try {
      // Lazy-load the SDK so local tests can run with a mocked provider path.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const anthropicModule = require("@anthropic-ai/sdk");
      const Anthropic = anthropicModule.default ?? anthropicModule;
      this.client = new Anthropic({ apiKey }) as AnthropicClient;
      return this.client;
    } catch {
      throw new AiProviderError(
        "config",
        "@anthropic-ai/sdk is not installed.",
        false,
        undefined
      );
    }
  }

  private buildSystemPrompt(
    systemPrompt: string,
    developerPrompt?: string
  ) {
    return developerPrompt
      ? `${systemPrompt}\n\nDeveloper instructions:\n${developerPrompt}`
      : systemPrompt;
  }

  private classifyError(error: unknown): AiProviderError {
    if (error instanceof AiProviderError) {
      return error;
    }

    const candidate = error as {
      status?: number;
      message?: string;
      code?: string;
      name?: string;
    };
    const message = candidate.message ?? "Unknown Anthropic provider error.";

    if (candidate.status === 401 || candidate.status === 403) {
      return new AiProviderError("auth", message, false, candidate.status, {
        cause: error
      });
    }

    if (candidate.status === 429) {
      return new AiProviderError("rate_limit", message, true, candidate.status, {
        cause: error
      });
    }

    if (typeof candidate.status === "number" && candidate.status >= 500) {
      return new AiProviderError("server", message, true, candidate.status, {
        cause: error
      });
    }

    if (
      candidate.name === "AbortError" ||
      candidate.code === "ETIMEDOUT" ||
      candidate.code === "ECONNRESET"
    ) {
      return new AiProviderError("timeout", message, true, candidate.status, {
        cause: error
      });
    }

    return new AiProviderError("unknown", message, false, candidate.status, {
      cause: error
    });
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startedAt = Date.now();

    try {
      const client = this.getClient();
      const response = await client.messages.create({
        model: request.config.model,
        max_tokens: request.config.maxTokens,
        temperature: request.config.temperature,
        system: this.buildSystemPrompt(
          request.systemPrompt,
          request.developerPrompt
        ),
        messages: [
          {
            role: "user",
            content: request.userPrompt
          }
        ]
      });
      const content = Array.isArray(response.content)
        ? response.content
        : [];
      const rawText = content
        .filter((block) => (block as { type?: string }).type === "text")
        .map((block) => (block as { text?: string }).text ?? "")
        .join("\n")
        .trim();
      const usage = (response.usage ?? {}) as {
        input_tokens?: number;
        output_tokens?: number;
      };

      return {
        rawText,
        model: String(response.model ?? request.config.model),
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        latencyMs: Date.now() - startedAt,
        requestId: request.requestId
      };
    } catch (error) {
      throw this.classifyError(error);
    }
  }
}
