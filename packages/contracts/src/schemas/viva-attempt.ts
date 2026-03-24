import { z } from "zod";
import { VIVA_ATTEMPT_STATUSES } from "../enums";
import { auditFieldsSchema, isoDateTimeStringSchema, scoreValueSchema } from "./common";
import { artifactIdSchema, evaluationIdSchema, promptTemplateIdSchema, sessionIdSchema, vivaAttemptIdSchema } from "./ids";

export const vivaAttemptSchema = auditFieldsSchema.extend({
  id: vivaAttemptIdSchema,
  sessionId: sessionIdSchema,
  promptTemplateId: promptTemplateIdSchema.optional(),
  status: z.enum(VIVA_ATTEMPT_STATUSES),
  scheduledAt: isoDateTimeStringSchema.optional(),
  startedAt: isoDateTimeStringSchema.optional(),
  completedAt: isoDateTimeStringSchema.optional(),
  transcriptArtifactId: artifactIdSchema.optional(),
  evaluationId: evaluationIdSchema.optional(),
  score: scoreValueSchema.optional(),
  passingScore: scoreValueSchema.optional(),
  notes: z.string().trim().min(1).optional()
});

export type VivaAttempt = z.infer<typeof vivaAttemptSchema>;
