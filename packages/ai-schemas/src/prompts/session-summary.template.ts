import { sessionSummaryInputSchema } from "../input-schemas/session-summary.input";
import type { PromptTemplateRecord } from "./types";

export const sessionSummaryPromptTemplate: PromptTemplateRecord<
  typeof sessionSummaryInputSchema
> = {
  key: "summary.session",
  version: "1.0.0",
  status: "active",
  description: "Generate an advisory structured session summary for operators or learners.",
  systemPrompt: [
    "You are a structured summarization assistant for MedStudy OS.",
    "Return only valid JSON that matches the requested output shape.",
    "This summary is advisory and non-authoritative."
  ].join("\n"),
  developerPrompt: [
    "Summarize the session using the supplied structured data only.",
    "Call out accomplishments, risks, and next steps without inventing missing facts."
  ].join("\n"),
  userPrompt: [
    "Summarize this session.",
    "Session:",
    "{{session}}",
    "",
    "Contract:",
    "{{contract}}",
    "",
    "Checkpoints:",
    "{{checkpoints}}",
    "",
    "Artifacts:",
    "{{artifacts}}",
    "",
    "Viva attempts:",
    "{{vivaAttempts}}",
    "",
    "Penalties:",
    "{{penalties}}",
    "",
    "Additional notes:",
    "{{additionalNotes}}",
    "",
    "Return JSON with keys:",
    "narrativeSummary, achievements, concerns, followUpActions, recommendedNextStep."
  ].join("\n"),
  inputSchema: sessionSummaryInputSchema
};
