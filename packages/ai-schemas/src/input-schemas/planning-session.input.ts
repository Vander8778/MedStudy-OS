import { z } from "zod";
import {
  PROFILE_STUDY_STAGES,
  contractSummaryViewSchema,
  nonEmptyStringSchema,
  sessionViewSchema
} from "@medstudy/contracts";

export const planningSessionInputSchema = z.object({
  session: sessionViewSchema,
  contract: contractSummaryViewSchema,
  learnerProfile: z.object({
    studyStage: z.enum(PROFILE_STUDY_STAGES).optional(),
    focusTopics: z.array(nonEmptyStringSchema).readonly().default([]),
    constraints: z.array(nonEmptyStringSchema).readonly().default([]),
    notes: nonEmptyStringSchema.optional()
  }).strict(),
  recentSummaries: z.array(
    z.object({
      title: nonEmptyStringSchema,
      summary: nonEmptyStringSchema
    }).strict()
  ).readonly().default([])
}).strict();

export type PlanningSessionInput = z.infer<typeof planningSessionInputSchema>;
