import { z } from "zod";
import { ACTOR_TYPES, EVALUATION_STATUSES, EVALUATION_TYPES } from "../enums";
import { auditFieldsSchema, isoDateTimeStringSchema, scoreValueSchema } from "./common";
import { artifactIdSchema, checkpointIdSchema, evaluationIdSchema, sessionIdSchema, vivaAttemptIdSchema } from "./ids";

export const evaluationSchema = auditFieldsSchema.extend({
  id: evaluationIdSchema,
  sessionId: sessionIdSchema,
  type: z.enum(EVALUATION_TYPES),
  status: z.enum(EVALUATION_STATUSES),
  evaluator: z.enum(ACTOR_TYPES),
  artifactId: artifactIdSchema.optional(),
  checkpointId: checkpointIdSchema.optional(),
  vivaAttemptId: vivaAttemptIdSchema.optional(),
  evaluatedAt: isoDateTimeStringSchema.optional(),
  score: scoreValueSchema.optional(),
  notes: z.string().trim().min(1).optional(),
  evidenceArtifactIds: z.array(artifactIdSchema).readonly()
});

export type Evaluation = z.infer<typeof evaluationSchema>;
