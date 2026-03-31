import { z } from "zod";
import { nonEmptyStringSchema, scoreValueSchema } from "@medstudy/contracts";

const vivaRubricScoreSchema = z.object({
  criterionKey: nonEmptyStringSchema,
  score: scoreValueSchema,
  justification: nonEmptyStringSchema
}).strict();

export const vivaEvaluationOutputSchema = z.object({
  summary: nonEmptyStringSchema,
  overallScore: scoreValueSchema,
  rubricScores: z.array(vivaRubricScoreSchema).min(1).readonly(),
  strengths: z.array(nonEmptyStringSchema).readonly(),
  concerns: z.array(nonEmptyStringSchema).readonly(),
  followUpQuestions: z.array(nonEmptyStringSchema).readonly(),
  confidence: z.enum(["low", "medium", "high"])
}).strict();

export type VivaEvaluationOutput = z.infer<typeof vivaEvaluationOutputSchema>;
