import { z } from "zod";
import { nonEmptyStringSchema } from "@medstudy/contracts";

export const sessionSummaryOutputSchema = z.object({
  narrativeSummary: nonEmptyStringSchema,
  achievements: z.array(nonEmptyStringSchema).readonly(),
  concerns: z.array(nonEmptyStringSchema).readonly(),
  followUpActions: z.array(nonEmptyStringSchema).readonly(),
  recommendedNextStep: nonEmptyStringSchema
}).strict();

export type SessionSummaryOutput = z.infer<typeof sessionSummaryOutputSchema>;
