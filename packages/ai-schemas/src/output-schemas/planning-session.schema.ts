import { z } from "zod";
import { durationMinutesSchema, nonEmptyStringSchema } from "@medstudy/contracts";

export const planningSessionOutputSchema = z.object({
  recommendedTitle: nonEmptyStringSchema,
  objectiveSummary: nonEmptyStringSchema,
  agenda: z.array(z.object({
    title: nonEmptyStringSchema,
    durationMinutes: durationMinutesSchema,
    rationale: nonEmptyStringSchema
  }).strict()).min(1).readonly(),
  checkpointFocusAreas: z.array(nonEmptyStringSchema).readonly(),
  riskFlags: z.array(nonEmptyStringSchema).readonly(),
  coachingNotes: z.array(nonEmptyStringSchema).readonly()
}).strict();

export type PlanningSessionOutput = z.infer<typeof planningSessionOutputSchema>;
