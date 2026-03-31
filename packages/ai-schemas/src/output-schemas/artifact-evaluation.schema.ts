import { z } from "zod";
import { nonEmptyStringSchema, scoreValueSchema } from "@medstudy/contracts";

const artifactRubricScoreSchema = z.object({
  criterionKey: nonEmptyStringSchema,
  score: scoreValueSchema,
  justification: nonEmptyStringSchema
}).strict();

export const artifactEvaluationOutputSchema = z.object({
  summary: nonEmptyStringSchema,
  overallScore: scoreValueSchema,
  rubricScores: z.array(artifactRubricScoreSchema).min(1).readonly(),
  strengths: z.array(nonEmptyStringSchema).readonly(),
  concerns: z.array(nonEmptyStringSchema).readonly(),
  recommendedFollowUp: z.array(nonEmptyStringSchema).readonly(),
  confidence: z.enum(["low", "medium", "high"])
}).strict();

export type ArtifactEvaluationOutput = z.infer<typeof artifactEvaluationOutputSchema>;
