import { Injectable } from "@nestjs/common";
import { AnthropicProvider } from "./anthropic.provider";
import type { AiProvider } from "./ai-provider.interface";
import type {
  AiAuditLevel,
  AiCapabilityKey,
  AiProviderConfig,
  AiProviderKey
} from "../types";

@Injectable()
export class ProviderRegistry {
  constructor(private readonly anthropicProvider: AnthropicProvider) {}

  getProvider(key: AiProviderKey = "anthropic"): AiProvider {
    if (key === "anthropic") {
      return this.anthropicProvider;
    }

    throw new Error(`Unsupported AI provider: ${key}`);
  }

  getDefaultConfig(_capabilityKey: AiCapabilityKey): AiProviderConfig {
    return {
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      maxTokens: Number(process.env.AI_MAX_TOKENS ?? 1500),
      temperature: Number(process.env.AI_TEMPERATURE ?? 0.2)
    };
  }

  getAuditLevel(): AiAuditLevel {
    const raw = process.env.AI_AUDIT_LEVEL;

    if (
      raw === "minimal" ||
      raw === "validated_output" ||
      raw === "full"
    ) {
      return raw;
    }

    return "minimal";
  }
}
