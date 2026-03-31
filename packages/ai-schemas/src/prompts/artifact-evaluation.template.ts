import { artifactEvaluationInputSchema } from "../input-schemas/artifact-evaluation.input";
import type { PromptTemplateRecord } from "./types";

export const artifactEvaluationPromptTemplate: PromptTemplateRecord<
  typeof artifactEvaluationInputSchema
> = {
  key: "evaluation.artifact",
  version: "1.0.0",
  status: "active",
  description: "Produce an advisory artifact evaluation against a rubric.",
  systemPrompt: [
    "You are an artifact-review assistant for MedStudy OS.",
    "Return only valid JSON that matches the requested output shape.",
    "Do not make final outcome decisions; provide structured advisory analysis only."
  ].join("\n"),
  developerPrompt: [
    "Score the artifact against the supplied rubric.",
    "Ground every justification in the artifact text and supplied session context."
  ].join("\n"),
  userPrompt: [
    "Evaluate this artifact.",
    "Session:",
    "{{session}}",
    "",
    "Contract:",
    "{{contract}}",
    "",
    "Artifact metadata:",
    "{{artifact}}",
    "",
    "Artifact text:",
    "{{artifactText}}",
    "",
    "Rubric:",
    "{{rubric}}",
    "",
    "Checkpoint context:",
    "{{checkpointContext}}",
    "",
    "Return JSON with keys:",
    "summary, overallScore, rubricScores, strengths, concerns, recommendedFollowUp, confidence."
  ].join("\n"),
  inputSchema: artifactEvaluationInputSchema
};
