import { z } from "zod";
import {
  ACTOR_TYPES,
  ARTIFACT_SOURCES,
  ARTIFACT_STATUSES,
  ARTIFACT_TYPES,
  CHECKPOINT_STATUSES,
  CONTRACT_STATUSES,
  PENALTY_REASONS,
  PENALTY_STATUSES,
  PENALTY_TYPES,
  SESSION_BLOCK_TYPES,
  SESSION_EVENT_TYPES,
  SESSION_STATES,
  VIVA_ATTEMPT_STATUSES
} from "../enums";
import {
  durationMinutesSchema,
  isoDateTimeStringSchema,
  metadataSchema,
  nonEmptyStringSchema,
  scoreValueSchema,
  timeRangeSchema,
  urlStringSchema
} from "../schemas/common";
import { contractTermsSchema } from "../schemas/contract";

export const SESSION_OUTCOMES = ["completed", "partial", "failed"] as const;
export const RESUME_REASONS = [
  "warning_resolved",
  "pause_within_limit",
  "manual_clear",
  "admin_clear"
] as const;
// Keep this runtime validation list aligned with the domain ResumeReason union that the
// backend orchestrator passes through to M2. The API layer intentionally validates here,
// but the semantic source of truth still lives in the domain layer.
export const AVOIDANCE_SEVERITIES = [
  "none",
  "low",
  "moderate",
  "high",
  "critical"
] as const;
export const AVOIDANCE_RECOMMENDED_RESPONSES = [
  "no_action",
  "log_only",
  "nudge_user",
  "raise_warning",
  "escalate_to_review",
  "flag_for_admin"
] as const;

export const sessionActionActorSchema = z.object({
  actorType: z.enum(ACTOR_TYPES),
  userId: nonEmptyStringSchema.optional(),
  label: nonEmptyStringSchema.max(200).optional()
});

export const timeRangeViewSchema = timeRangeSchema;

export const sessionViewSchema = z.object({
  id: nonEmptyStringSchema,
  userId: nonEmptyStringSchema,
  profileId: nonEmptyStringSchema,
  contractId: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  objective: nonEmptyStringSchema,
  state: z.enum(SESSION_STATES),
  plannedRange: timeRangeViewSchema,
  startedAt: isoDateTimeStringSchema.optional(),
  endedAt: isoDateTimeStringSchema.optional(),
  reviewRequestedAt: isoDateTimeStringSchema.optional(),
  validMinutes: durationMinutesSchema,
  invalidMinutes: durationMinutesSchema,
  warningCount: z.number().int().nonnegative(),
  missedCheckpointCount: z.number().int().nonnegative(),
  finalArtifactRequired: z.boolean(),
  notes: nonEmptyStringSchema.optional(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const contractSummaryViewSchema = z.object({
  id: nonEmptyStringSchema,
  userId: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  description: nonEmptyStringSchema.optional(),
  status: z.enum(CONTRACT_STATUSES),
  terms: contractTermsSchema,
  activeRange: timeRangeViewSchema,
  signedAt: isoDateTimeStringSchema.optional(),
  activatedAt: isoDateTimeStringSchema.optional(),
  endedAt: isoDateTimeStringSchema.optional(),
  tags: z.array(nonEmptyStringSchema).readonly(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const checkpointViewSchema = z.object({
  id: nonEmptyStringSchema,
  sessionId: nonEmptyStringSchema,
  order: z.number().int().nonnegative(),
  title: nonEmptyStringSchema,
  status: z.enum(CHECKPOINT_STATUSES),
  dueAt: isoDateTimeStringSchema,
  completedAt: isoDateTimeStringSchema.optional(),
  artifactId: nonEmptyStringSchema.optional(),
  evaluationId: nonEmptyStringSchema.optional(),
  notes: nonEmptyStringSchema.optional(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const artifactViewSchema = z.object({
  id: nonEmptyStringSchema,
  sessionId: nonEmptyStringSchema,
  type: z.enum(ARTIFACT_TYPES),
  source: z.enum(ARTIFACT_SOURCES),
  status: z.enum(ARTIFACT_STATUSES),
  title: nonEmptyStringSchema,
  description: nonEmptyStringSchema.optional(),
  isMandatory: z.boolean(),
  createdByUserId: nonEmptyStringSchema.optional(),
  submittedAt: isoDateTimeStringSchema.optional(),
  uri: urlStringSchema.optional(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const vivaAttemptViewSchema = z.object({
  id: nonEmptyStringSchema,
  sessionId: nonEmptyStringSchema,
  status: z.enum(VIVA_ATTEMPT_STATUSES),
  scheduledAt: isoDateTimeStringSchema.optional(),
  startedAt: isoDateTimeStringSchema.optional(),
  completedAt: isoDateTimeStringSchema.optional(),
  score: scoreValueSchema.optional(),
  passingScore: scoreValueSchema.optional(),
  notes: nonEmptyStringSchema.optional(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const sessionBlockViewSchema = z.object({
  id: nonEmptyStringSchema,
  sessionId: nonEmptyStringSchema,
  type: z.enum(SESSION_BLOCK_TYPES),
  range: timeRangeViewSchema,
  sourceEventId: nonEmptyStringSchema.optional(),
  creditedMinutes: durationMinutesSchema,
  notes: nonEmptyStringSchema.optional(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const penaltyViewSchema = z.object({
  id: nonEmptyStringSchema,
  userId: nonEmptyStringSchema,
  contractId: nonEmptyStringSchema.optional(),
  sessionId: nonEmptyStringSchema.optional(),
  type: z.enum(PENALTY_TYPES),
  reason: z.enum(PENALTY_REASONS),
  status: z.enum(PENALTY_STATUSES),
  issuedAt: isoDateTimeStringSchema,
  expiresAt: isoDateTimeStringSchema.optional(),
  resolvedAt: isoDateTimeStringSchema.optional(),
  notes: nonEmptyStringSchema.optional(),
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const sessionEventViewSchema = z.object({
  id: nonEmptyStringSchema,
  sessionId: nonEmptyStringSchema,
  type: z.enum(SESSION_EVENT_TYPES),
  actor: sessionActionActorSchema,
  state: z.enum(SESSION_STATES).optional(),
  occurredAt: isoDateTimeStringSchema,
  details: metadataSchema.optional()
});

export const componentScoreViewSchema = z.object({
  raw: z.number().nullable(),
  weight: z.number(),
  weighted: z.number()
});

export const scoringResultViewSchema = z.object({
  outcome: z.enum(SESSION_OUTCOMES),
  sessionScore: z.number(),
  components: z.object({
    validTime: componentScoreViewSchema,
    process: componentScoreViewSchema,
    artifact: componentScoreViewSchema,
    knowledge: componentScoreViewSchema
  }),
  hardFailTriggered: z.boolean(),
  hardFailReasons: z.array(nonEmptyStringSchema).readonly(),
  decisionTrace: z.object({
    decidedByHardFail: z.boolean(),
    scoreThresholdApplied: z.object({
      min: z.number(),
      max: z.number(),
      outcome: z.enum(SESSION_OUTCOMES)
    }).optional()
  })
});

export const contractEvaluationSummaryViewSchema = z.object({
  allRulesPassed: z.boolean(),
  hasCriticalViolation: z.boolean(),
  criticalViolationCodes: z.array(nonEmptyStringSchema).readonly(),
  warningCodes: z.array(nonEmptyStringSchema).readonly(),
  informationalCodes: z.array(nonEmptyStringSchema).readonly()
});

export const createSessionRequestSchema = z.object({
  userId: nonEmptyStringSchema,
  profileId: nonEmptyStringSchema,
  contractId: nonEmptyStringSchema,
  title: nonEmptyStringSchema.max(200),
  objective: nonEmptyStringSchema.max(1000),
  plannedRange: timeRangeSchema,
  finalArtifactRequired: z.boolean(),
  notes: nonEmptyStringSchema.max(2000).optional(),
  metadata: metadataSchema.optional()
});

export const sessionActionRequestSchema = z.object({
  actor: sessionActionActorSchema.optional()
});

export const resumeSessionRequestSchema = sessionActionRequestSchema.extend({
  reason: z.enum(RESUME_REASONS)
});

export const submitArtifactRequestSchema = z.object({
  type: z.enum(ARTIFACT_TYPES),
  title: nonEmptyStringSchema.max(200),
  source: z.enum(ARTIFACT_SOURCES),
  status: z.enum(ARTIFACT_STATUSES),
  createdByUserId: nonEmptyStringSchema.optional(),
  description: nonEmptyStringSchema.max(2000).optional(),
  uri: urlStringSchema.optional(),
  metadata: metadataSchema.optional()
});

export const requestReviewRequestSchema = sessionActionRequestSchema;

export const sessionAggregateResponseSchema = z.object({
  session: sessionViewSchema,
  contract: contractSummaryViewSchema,
  checkpoints: z.array(checkpointViewSchema).readonly(),
  artifacts: z.array(artifactViewSchema).readonly(),
  vivaAttempts: z.array(vivaAttemptViewSchema).readonly(),
  blocks: z.array(sessionBlockViewSchema).readonly(),
  penalties: z.array(penaltyViewSchema).readonly()
});

export const sessionMutationResponseSchema = z.object({
  session: sessionViewSchema
});

export const submitArtifactResponseSchema = z.object({
  artifact: artifactViewSchema
});

export const reviewResultResponseSchema = z.object({
  session: sessionViewSchema,
  scoring: scoringResultViewSchema,
  contractEvaluation: contractEvaluationSummaryViewSchema
});

export const getSessionResponseSchema = sessionAggregateResponseSchema;

export const getScoringResponseSchema = z.object({
  scoring: scoringResultViewSchema.nullable()
});

export const getEventsResponseSchema = z.object({
  events: z.array(sessionEventViewSchema).readonly()
});

export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type SessionActionRequest = z.infer<typeof sessionActionRequestSchema>;
export type ResumeSessionRequest = z.infer<typeof resumeSessionRequestSchema>;
export type SubmitArtifactRequest = z.infer<typeof submitArtifactRequestSchema>;
export type RequestReviewRequest = z.infer<typeof requestReviewRequestSchema>;
export type TimeRangeView = z.infer<typeof timeRangeViewSchema>;
export type SessionView = z.infer<typeof sessionViewSchema>;
export type ContractSummaryView = z.infer<typeof contractSummaryViewSchema>;
export type CheckpointView = z.infer<typeof checkpointViewSchema>;
export type ArtifactView = z.infer<typeof artifactViewSchema>;
export type VivaAttemptView = z.infer<typeof vivaAttemptViewSchema>;
export type SessionBlockView = z.infer<typeof sessionBlockViewSchema>;
export type PenaltyView = z.infer<typeof penaltyViewSchema>;
export type SessionEventView = z.infer<typeof sessionEventViewSchema>;
export type ComponentScoreView = z.infer<typeof componentScoreViewSchema>;
export type ScoringResultView = z.infer<typeof scoringResultViewSchema>;
export type ContractEvaluationSummaryView =
  z.infer<typeof contractEvaluationSummaryViewSchema>;
export type SessionAggregateResponse = z.infer<typeof sessionAggregateResponseSchema>;
export type SessionMutationResponse = z.infer<typeof sessionMutationResponseSchema>;
export type SubmitArtifactResponse = z.infer<typeof submitArtifactResponseSchema>;
export type ReviewResultResponse = z.infer<typeof reviewResultResponseSchema>;
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;
export type GetScoringResponse = z.infer<typeof getScoringResponseSchema>;
export type GetEventsResponse = z.infer<typeof getEventsResponseSchema>;
