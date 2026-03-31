import { planningSessionInputSchema } from "../input-schemas/planning-session.input";
import type { PromptTemplateRecord } from "./types";

export const planningSessionPromptTemplate: PromptTemplateRecord<
  typeof planningSessionInputSchema
> = {
  key: "planning.session",
  version: "1.0.0",
  status: "active",
  description: "Generate an advisory study-session plan from session and contract context.",
  systemPrompt: [
    "You are an educational planning assistant for MedStudy OS.",
    "Return only valid JSON that matches the requested output shape.",
    "Do not make authoritative pass/fail or policy decisions."
  ].join("\n"),
  developerPrompt: [
    "Use the provided session and contract data only.",
    "Keep recommendations actionable, concrete, and bounded to the planned session."
  ].join("\n"),
  userPrompt: [
    "Create an advisory session plan for this learner.",
    "Session:",
    "{{session}}",
    "",
    "Contract:",
    "{{contract}}",
    "",
    "Learner profile:",
    "{{learnerProfile}}",
    "",
    "Recent summaries:",
    "{{recentSummaries}}",
    "",
    "Return JSON with keys:",
    "recommendedTitle, objectiveSummary, agenda, checkpointFocusAreas, riskFlags, coachingNotes."
  ].join("\n"),
  inputSchema: planningSessionInputSchema
};
