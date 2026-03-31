import { vivaEvaluationInputSchema } from "../input-schemas/viva-evaluation.input";
import type { PromptTemplateRecord } from "./types";

export const vivaEvaluationPromptTemplate: PromptTemplateRecord<
  typeof vivaEvaluationInputSchema
> = {
  key: "evaluation.viva",
  version: "1.0.0",
  status: "active",
  description: "Produce an advisory viva evaluation against a rubric.",
  systemPrompt: [
    "You are a viva-evaluation assistant for MedStudy OS.",
    "Return only valid JSON that matches the requested output shape.",
    "Do not decide final session outcomes."
  ].join("\n"),
  developerPrompt: [
    "Use only the supplied transcript and rubric.",
    "Keep scoring calibrated to the provided passing score and criterion weights."
  ].join("\n"),
  userPrompt: [
    "Evaluate this viva attempt.",
    "Session:",
    "{{session}}",
    "",
    "Contract:",
    "{{contract}}",
    "",
    "Viva attempt:",
    "{{vivaAttempt}}",
    "",
    "Transcript:",
    "{{transcript}}",
    "",
    "Rubric:",
    "{{rubric}}",
    "",
    "Focus topics:",
    "{{focusTopics}}",
    "",
    "Previous notes:",
    "{{previousNotes}}",
    "",
    "Return JSON with keys:",
    "summary, overallScore, rubricScores, strengths, concerns, followUpQuestions, confidence."
  ].join("\n"),
  inputSchema: vivaEvaluationInputSchema
};
