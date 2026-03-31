import { z } from "zod";
import {
  artifactViewSchema,
  checkpointViewSchema,
  contractSummaryViewSchema,
  nonEmptyStringSchema,
  penaltyViewSchema,
  sessionViewSchema,
  vivaAttemptViewSchema
} from "@medstudy/contracts";

export const sessionSummaryInputSchema = z.object({
  session: sessionViewSchema,
  contract: contractSummaryViewSchema,
  checkpoints: z.array(checkpointViewSchema).readonly().default([]),
  artifacts: z.array(artifactViewSchema).readonly().default([]),
  vivaAttempts: z.array(vivaAttemptViewSchema).readonly().default([]),
  penalties: z.array(penaltyViewSchema).readonly().default([]),
  additionalNotes: z.string().default("")
}).strict();

export type SessionSummaryInput = z.infer<typeof sessionSummaryInputSchema>;
