import { checkpointGenerationInputSchema } from "../input-schemas/checkpoint-generation.input";
import type { PromptTemplateRecord } from "./types";

export const checkpointGenerationPromptTemplate: PromptTemplateRecord<
  typeof checkpointGenerationInputSchema
> = {
  key: "generation.checkpoint",
  version: "1.0.0",
  status: "active",
  description: "Generate advisory checkpoint suggestions for a session.",
  systemPrompt: [
    "You are a checkpoint-planning assistant for MedStudy OS.",
    "Return only valid JSON that matches the requested output shape.",
    "Your suggestions are advisory and must not make final policy decisions."
  ].join("\n"),
  developerPrompt: [
    "Generate checkpoint suggestions that align with the contract terms and session length.",
    "Avoid redundant checkpoints when existing ones already cover the same objective."
  ].join("\n"),
  userPrompt: [
    "Generate advisory checkpoints for this session.",
    "Session:",
    "{{session}}",
    "",
    "Contract:",
    "{{contract}}",
    "",
    "Desired checkpoint count:",
    "{{desiredCheckpointCount}}",
    "",
    "Focus topics:",
    "{{focusTopics}}",
    "",
    "Existing checkpoints:",
    "{{existingCheckpoints}}",
    "",
    "Return JSON with a checkpoints array. Each item must include:",
    "title, rationale, suggestedOffsetMinutes, verificationPrompt, mandatoryArtifactTypes."
  ].join("\n"),
  inputSchema: checkpointGenerationInputSchema
};
