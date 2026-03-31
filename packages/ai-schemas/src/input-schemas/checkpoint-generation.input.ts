import { z } from "zod";
import {
  checkpointViewSchema,
  contractSummaryViewSchema,
  nonEmptyStringSchema,
  sessionViewSchema
} from "@medstudy/contracts";

export const checkpointGenerationInputSchema = z.object({
  session: sessionViewSchema,
  contract: contractSummaryViewSchema,
  desiredCheckpointCount: z.number().int().positive().max(12).default(3),
  focusTopics: z.array(nonEmptyStringSchema).readonly().default([]),
  existingCheckpoints: z.array(checkpointViewSchema).readonly().default([])
}).strict();

export type CheckpointGenerationInput = z.infer<typeof checkpointGenerationInputSchema>;
