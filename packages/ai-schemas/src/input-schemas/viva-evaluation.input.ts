import { z } from "zod";
import {
  contractSummaryViewSchema,
  nonEmptyStringSchema,
  scoreValueSchema,
  sessionViewSchema,
  vivaAttemptViewSchema
} from "@medstudy/contracts";

const vivaCriterionSchema = z.object({
  key: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  weight: z.number().positive()
}).strict();

export const vivaEvaluationInputSchema = z.object({
  session: sessionViewSchema,
  contract: contractSummaryViewSchema,
  vivaAttempt: vivaAttemptViewSchema,
  transcript: nonEmptyStringSchema,
  rubric: z.object({
    criteria: z.array(vivaCriterionSchema).min(1).readonly(),
    passingScore: scoreValueSchema
  }).strict(),
  focusTopics: z.array(nonEmptyStringSchema).readonly().default([]),
  previousNotes: z.array(nonEmptyStringSchema).readonly().default([])
}).strict();

export type VivaEvaluationInput = z.infer<typeof vivaEvaluationInputSchema>;
