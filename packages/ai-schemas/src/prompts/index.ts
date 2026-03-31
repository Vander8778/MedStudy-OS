export * from "./types";
export * from "./planning-session.template";
export * from "./checkpoint-generation.template";
export * from "./artifact-evaluation.template";
export * from "./viva-evaluation.template";
export * from "./session-summary.template";

import { checkpointGenerationPromptTemplate } from "./checkpoint-generation.template";
import { artifactEvaluationPromptTemplate } from "./artifact-evaluation.template";
import { planningSessionPromptTemplate } from "./planning-session.template";
import { sessionSummaryPromptTemplate } from "./session-summary.template";
import { vivaEvaluationPromptTemplate } from "./viva-evaluation.template";

export const aiPromptTemplates = [
  planningSessionPromptTemplate,
  checkpointGenerationPromptTemplate,
  artifactEvaluationPromptTemplate,
  vivaEvaluationPromptTemplate,
  sessionSummaryPromptTemplate
] as const;
