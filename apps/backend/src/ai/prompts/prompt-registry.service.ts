import { Injectable } from "@nestjs/common";
import {
  aiPromptTemplates,
  type AiCapabilityKey,
  type PromptTemplateRecord
} from "@medstudy/ai-schemas";

@Injectable()
export class PromptRegistryService {
  private readonly promptTemplates = new Map<
    AiCapabilityKey,
    readonly PromptTemplateRecord[]
  >();

  constructor() {
    for (const template of aiPromptTemplates) {
      const existing = this.promptTemplates.get(template.key) ?? [];
      this.promptTemplates.set(template.key, [...existing, template]);
    }
  }

  resolve(
    key: AiCapabilityKey,
    version?: string
  ): PromptTemplateRecord | null {
    const templates = this.promptTemplates.get(key) ?? [];

    if (version) {
      return templates.find((template) => template.version === version) ?? null;
    }

    return [...templates]
      .reverse()
      .find((template) => template.status === "active") ?? null;
  }
}
