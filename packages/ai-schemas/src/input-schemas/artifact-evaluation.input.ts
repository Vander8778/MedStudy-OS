import { z } from "zod";
import {
  artifactViewSchema,
  contractSummaryViewSchema,
  nonEmptyStringSchema,
  scoreValueSchema,
  sessionViewSchema
} from "@medstudy/contracts";

const evaluationCriterionSchema = z.object({
  key: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  weight: z.number().positive()
}).strict();

export const artifactEvaluationInputSchema = z.object({
  session: sessionViewSchema,
  contract: contractSummaryViewSchema,
  artifact: artifactViewSchema,
  artifactText: nonEmptyStringSchema,
  rubric: z.object({
    criteria: z.array(evaluationCriterionSchema).min(1).readonly(),
    passThreshold: scoreValueSchema.optional()
  }).strict(),
  checkpointContext: z.object({
    checkpointTitle: nonEmptyStringSchema,
    checkpointInstructions: nonEmptyStringSchema
  }).strict().nullable().default(null)
}).strict();

export type ArtifactEvaluationInput = z.infer<typeof artifactEvaluationInputSchema>;
