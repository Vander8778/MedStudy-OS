import { z } from "zod";
import { isoDateTimeStringSchema, nonEmptyStringSchema, scoreValueSchema } from "../schemas/common";
import { artifactIdSchema, checkpointIdSchema, evaluationIdSchema, penaltyIdSchema, sessionIdSchema, userIdSchema } from "../schemas/ids";

const domainEventBaseSchema = z.object({
  id: nonEmptyStringSchema,
  occurredAt: isoDateTimeStringSchema,
  sessionId: sessionIdSchema.optional(),
  userId: userIdSchema.optional()
});

export const sessionStartedEventSchema = domainEventBaseSchema.extend({
  type: z.literal("session.started"),
  sessionId: sessionIdSchema,
  userId: userIdSchema
});

export const checkpointMissedEventSchema = domainEventBaseSchema.extend({
  type: z.literal("checkpoint.missed"),
  sessionId: sessionIdSchema,
  userId: userIdSchema,
  checkpointId: checkpointIdSchema
});

export const artifactSubmittedEventSchema = domainEventBaseSchema.extend({
  type: z.literal("artifact.submitted"),
  sessionId: sessionIdSchema,
  userId: userIdSchema,
  artifactId: artifactIdSchema
});

export const evaluationCompletedEventSchema = domainEventBaseSchema.extend({
  type: z.literal("evaluation.completed"),
  sessionId: sessionIdSchema,
  userId: userIdSchema,
  evaluationId: evaluationIdSchema,
  score: scoreValueSchema.optional()
});

export const penaltyIssuedEventSchema = domainEventBaseSchema.extend({
  type: z.literal("penalty.issued"),
  userId: userIdSchema,
  penaltyId: penaltyIdSchema
});

export const domainEventSchema = z.discriminatedUnion("type", [
  sessionStartedEventSchema,
  checkpointMissedEventSchema,
  artifactSubmittedEventSchema,
  evaluationCompletedEventSchema,
  penaltyIssuedEventSchema
]);

export type SessionStartedEvent = z.infer<typeof sessionStartedEventSchema>;
export type CheckpointMissedEvent = z.infer<typeof checkpointMissedEventSchema>;
export type ArtifactSubmittedEvent = z.infer<typeof artifactSubmittedEventSchema>;
export type EvaluationCompletedEvent = z.infer<typeof evaluationCompletedEventSchema>;
export type PenaltyIssuedEvent = z.infer<typeof penaltyIssuedEventSchema>;
export type DomainEvent = z.infer<typeof domainEventSchema>;
