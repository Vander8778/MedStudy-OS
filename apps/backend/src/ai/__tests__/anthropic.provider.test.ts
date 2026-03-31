import { describe, expect, it, vi } from "vitest";
import { AnthropicProvider } from "../providers/anthropic.provider";
import { AiProviderError } from "../types";

describe("AnthropicProvider", () => {
  it("keeps developer instructions in the system prompt and leaves the user message clean", async () => {
    const create = vi.fn(async () => ({
      content: [
        {
          type: "text",
          text: '{"ok":true}'
        }
      ],
      model: "claude-test",
      usage: {
        input_tokens: 10,
        output_tokens: 5
      }
    }));
    const provider = new AnthropicProvider();
    (provider as never).client = {
      messages: {
        create
      }
    };

    await provider.complete({
      requestId: "request_1",
      systemPrompt: "System prompt",
      developerPrompt: "Developer rules",
      userPrompt: "User content",
      config: {
        model: "claude-test",
        maxTokens: 1000,
        temperature: 0.2
      }
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "System prompt\n\nDeveloper instructions:\nDeveloper rules",
        messages: [
          {
            role: "user",
            content: "User content"
          }
        ]
      })
    );
  });

  it("preserves the original provider error as the cause", async () => {
    const rawError = {
      status: 429,
      message: "Too many requests"
    };
    const provider = new AnthropicProvider();
    (provider as never).client = {
      messages: {
        create: vi.fn(async () => {
          throw rawError;
        })
      }
    };

    await expect(
      provider.complete({
        requestId: "request_1",
        systemPrompt: "System prompt",
        developerPrompt: "Developer rules",
        userPrompt: "User content",
        config: {
          model: "claude-test",
          maxTokens: 1000,
          temperature: 0.2
        }
      })
    ).rejects.toEqual(
      expect.objectContaining({
        name: "AiProviderError",
        kind: "rate_limit",
        retryable: true,
        cause: rawError
      } satisfies Partial<AiProviderError>)
    );
  });

  it("maps auth errors to a non-retryable auth provider error", async () => {
    const provider = new AnthropicProvider();
    (provider as never).client = {
      messages: {
        create: vi.fn(async () => {
          throw {
            status: 401,
            message: "Unauthorized"
          };
        })
      }
    };

    await expect(
      provider.complete({
        requestId: "request_1",
        systemPrompt: "System prompt",
        userPrompt: "User content",
        config: {
          model: "claude-test",
          maxTokens: 1000,
          temperature: 0.2
        }
      })
    ).rejects.toEqual(
      expect.objectContaining({
        kind: "auth",
        retryable: false,
        statusCode: 401
      } satisfies Partial<AiProviderError>)
    );
  });

  it("maps timeout-shaped errors to a retryable timeout provider error", async () => {
    const provider = new AnthropicProvider();
    (provider as never).client = {
      messages: {
        create: vi.fn(async () => {
          throw {
            name: "AbortError",
            message: "Request timed out"
          };
        })
      }
    };

    await expect(
      provider.complete({
        requestId: "request_1",
        systemPrompt: "System prompt",
        userPrompt: "User content",
        config: {
          model: "claude-test",
          maxTokens: 1000,
          temperature: 0.2
        }
      })
    ).rejects.toEqual(
      expect.objectContaining({
        kind: "timeout",
        retryable: true
      } satisfies Partial<AiProviderError>)
    );
  });

  it("fails fast with a config error when the API key is missing and no client is initialized", async () => {
    const previousApiKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const provider = new AnthropicProvider();

    try {
      await expect(
        provider.complete({
          requestId: "request_1",
          systemPrompt: "System prompt",
          userPrompt: "User content",
          config: {
            model: "claude-test",
            maxTokens: 1000,
            temperature: 0.2
          }
        })
      ).rejects.toEqual(
        expect.objectContaining({
          kind: "config",
          retryable: false,
          message: "ANTHROPIC_API_KEY is not configured."
        } satisfies Partial<AiProviderError>)
      );
    } finally {
      if (previousApiKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = previousApiKey;
      }
    }
  });
});
