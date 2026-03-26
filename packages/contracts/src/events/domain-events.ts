import { z } from "zod";
import { SESSION_STATES } from "../enums";
import { isoDateTimeStringSchema, nonEmptyStringSchema, scoreValueSchema } from "../schemas/common";
import { artifactIdSchema, checkpointIdSchema, evaluationIdSchema, penaltyIdSchema, sessionIdSchema, userIdSchema } from "../schemas/ids";

const domainEventBaseSchema = z.object({
  id: nonEmptyStringSchema,
  occurredAt: isoDateTimeStringSchema,
  sessionId: sessionIdSchema.optional(),
  userId: userIdSchema.optional()
});

const sessionDomainEventBaseSchema = domainEventBaseSchema.extend({
  sessionId: sessionIdSchema,
  userId: userIdSchema
});

export const sessionStateChangedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.state_changed"),
  fromState: z.enum(SESSION_STATES),
  toState: z.enum(SESSION_STATES)
});

export const sessionStartedEventSchema = domainEventBaseSchema.extend({
  type: z.literal("session.started"),
  sessionId: sessionIdSchema,
  userId: userIdSchema
});

export const sessionWarningRaisedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.warning_raised")
});

export const sessionWarningClearedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.warning_cleared")
});

export const sessionPausedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.paused")
});

export const sessionResumedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.resumed")
});

export const sessionInvalidBlockStartedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.invalid_block_started")
});

export const sessionReviewStartedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.review_started")
});

export const sessionCompletedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.completed")
});

export const sessionPartialEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.partial")
});

export const sessionFailedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.failed")
});

export const sessionPenalizedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.penalized")
});

export const sessionExcusedEventSchema = sessionDomainEventBaseSchema.extend({
  type: z.literal("session.excused")
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
  sessionStateChangedEventSchema,
  sessionStartedEventSchema,
  sessionWarningRaisedEventSchema,
  sessionWarningClearedEventSchema,
  sessionPausedEventSchema,
  sessionResumedEventSchema,
  sessionInvalidBlockStartedEventSchema,
  sessionReviewStartedEventSchema,
  sessionCompletedEventSchema,
  sessionPartialEventSchema,
  sessionFailedEventSchema,
  sessionPenalizedEventSchema,
  sessionExcusedEventSchema,
  checkpointMissedEventSchema,
  artifactSubmittedEventSchema,
  evaluationCompletedEventSchema,
  penaltyIssuedEventSchema
]);

export type SessionStateChangedEvent = z.infer<typeof sessionStateChangedEventSchema>;
export type SessionStartedEvent = z.infer<typeof sessionStartedEventSchema>;
export type SessionWarningRaisedEvent = z.infer<typeof sessionWarningRaisedEventSchema>;
export type SessionWarningClearedEvent = z.infer<typeof sessionWarningClearedEventSchema>;
export type SessionPausedEvent = z.infer<typeof sessionPausedEventSchema>;
export type SessionResumedEvent = z.infer<typeof sessionResumedEventSchema>;
export type SessionInvalidBlockStartedEvent = z.infer<typeof sessionInvalidBlockStartedEventSchema>;
export type SessionReviewStartedEvent = z.infer<typeof sessionReviewStartedEventSchema>;
export type SessionCompletedEvent = z.infer<typeof sessionCompletedEventSchema>;
export type SessionPartialEvent = z.infer<typeof sessionPartialEventSchema>;
export type SessionFailedEvent = z.infer<typeof sessionFailedEventSchema>;
export type SessionPenalizedEvent = z.infer<typeof sessionPenalizedEventSchema>;
export type SessionExcusedEvent = z.infer<typeof sessionExcusedEventSchema>;
export type CheckpointMissedEvent = z.infer<typeof checkpointMissedEventSchema>;
export type ArtifactSubmittedEvent = z.infer<typeof artifactSubmittedEventSchema>;
export type EvaluationCompletedEvent = z.infer<typeof evaluationCompletedEventSchema>;
export type PenaltyIssuedEvent = z.infer<typeof penaltyIssuedEventSchema>;
export type DomainEvent = z.infer<typeof domainEventSchema>;
