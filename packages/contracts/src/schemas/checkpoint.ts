import { z } from "zod";
import { CHECKPOINT_STATUSES } from "../enums";
import { auditFieldsSchema, isoDateTimeStringSchema } from "./common";
import { artifactIdSchema, checkpointIdSchema, evaluationIdSchema, sessionIdSchema } from "./ids";

export const checkpointSchema = auditFieldsSchema.extend({
  id: checkpointIdSchema,
  sessionId: sessionIdSchema,
  order: z.number().int().nonnegative(),
  title: z.string().trim().min(1),
  status: z.enum(CHECKPOINT_STATUSES),
  dueAt: isoDateTimeStringSchema,
  completedAt: isoDateTimeStringSchema.optional(),
  artifactId: artifactIdSchema.optional(),
  evaluationId: evaluationIdSchema.optional(),
  notes: z.string().trim().min(1).optional()
});

export type Checkpoint = z.infer<typeof checkpointSchema>;
