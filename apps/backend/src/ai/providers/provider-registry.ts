import { Injectable } from "@nestjs/common";
import { getEnv } from "../../config/env";
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
    const env = getEnv();
    return {
      model: env.anthropicModel,
      maxTokens: env.aiMaxTokens,
      temperature: env.aiTemperature
    };
  }

  getAuditLevel(): AiAuditLevel {
    const raw = getEnv().aiAuditLevel;

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
