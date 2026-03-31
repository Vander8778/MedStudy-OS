import type { ZodTypeAny } from "zod";

export const AI_CAPABILITY_KEYS = [
  "planning.session",
  "generation.checkpoint",
  "evaluation.artifact",
  "evaluation.viva",
  "summary.session"
] as const;

export type AiCapabilityKey = (typeof AI_CAPABILITY_KEYS)[number];
export type PromptTemplateStatus = "active" | "deprecated" | "archived";

export type PromptTemplateRecord<TInputSchema extends ZodTypeAny = ZodTypeAny> = {
  key: AiCapabilityKey;
  version: string;
  status: PromptTemplateStatus;
  description: string;
  systemPrompt: string;
  developerPrompt?: string;
  userPrompt: string;
  inputSchema: TInputSchema;
};
