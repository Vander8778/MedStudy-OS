import { z } from "zod";
import { ACTOR_TYPES, SESSION_BLOCK_TYPES, SESSION_EVENT_TYPES, SESSION_STATES } from "../enums";
import {
  auditFieldsSchema,
  durationMinutesSchema,
  isoDateTimeStringSchema,
  metadataSchema,
  timeRangeSchema
} from "./common";
import {
  artifactIdSchema,
  checkpointIdSchema,
  contractIdSchema,
  evaluationIdSchema,
  penaltyIdSchema,
  profileIdSchema,
  sessionBlockIdSchema,
  sessionEventIdSchema,
  sessionIdSchema,
  userIdSchema,
  vivaAttemptIdSchema
} from "./ids";

export const sessionActorReferenceSchema = z.object({
  actorType: z.enum(ACTOR_TYPES),
  userId: userIdSchema.optional(),
  label: z.string().trim().min(1).optional()
});

export const sessionSchema = auditFieldsSchema.extend({
  id: sessionIdSchema,
  userId: userIdSchema,
  profileId: profileIdSchema,
  contractId: contractIdSchema,
  title: z.string().trim().min(1),
  objective: z.string().trim().min(1),
  state: z.enum(SESSION_STATES),
  plannedRange: timeRangeSchema,
  startedAt: isoDateTimeStringSchema.optional(),
  endedAt: isoDateTimeStringSchema.optional(),
  reviewRequestedAt: isoDateTimeStringSchema.optional(),
  validMinutes: durationMinutesSchema,
  invalidMinutes: durationMinutesSchema,
  warningCount: z.number().int().nonnegative(),
  missedCheckpointCount: z.number().int().nonnegative(),
  finalArtifactRequired: z.boolean(),
  blockIds: z.array(sessionBlockIdSchema).readonly(),
  checkpointIds: z.array(checkpointIdSchema).readonly(),
  artifactIds: z.array(artifactIdSchema).readonly(),
  evaluationIds: z.array(evaluationIdSchema).readonly(),
  vivaAttemptIds: z.array(vivaAttemptIdSchema).readonly(),
  penaltyIds: z.array(penaltyIdSchema).readonly(),
  notes: z.string().trim().min(1).optional(),
  metadata: metadataSchema.optional()
});

export const sessionBlockSchema = auditFieldsSchema.extend({
  id: sessionBlockIdSchema,
  sessionId: sessionIdSchema,
  type: z.enum(SESSION_BLOCK_TYPES),
  range: timeRangeSchema,
  sourceEventId: sessionEventIdSchema.optional(),
  creditedMinutes: durationMinutesSchema,
  notes: z.string().trim().min(1).optional()
});

export const sessionEventSchema = z.object({
  id: sessionEventIdSchema,
  sessionId: sessionIdSchema,
  type: z.enum(SESSION_EVENT_TYPES),
  actor: sessionActorReferenceSchema,
  state: z.enum(SESSION_STATES).optional(),
  occurredAt: isoDateTimeStringSchema,
  details: metadataSchema.optional()
});

export type Session = z.infer<typeof sessionSchema>;
export type SessionBlock = z.infer<typeof sessionBlockSchema>;
export type SessionActorReference = z.infer<typeof sessionActorReferenceSchema>;
export type SessionEvent = z.infer<typeof sessionEventSchema>;
