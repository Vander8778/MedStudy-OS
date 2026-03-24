import type { AuditFields, MetadataMap } from "../value-objects/common";
import type {
  ActorType,
  ArtifactSource,
  ArtifactStatus,
  ArtifactType,
  CheckpointStatus,
  EvaluationStatus,
  EvaluationType,
  PenaltyReason,
  PenaltyStatus,
  PenaltyType,
  SessionBlockType,
  SessionEventType,
  SessionState,
  TelemetryEventType,
  TelemetrySource,
  VivaAttemptStatus
} from "../value-objects/enums";
import type {
  ArtifactId,
  CheckpointId,
  ContractId,
  EvaluationId,
  PenaltyId,
  ProfileId,
  PromptTemplateId,
  SessionBlockId,
  SessionEventId,
  SessionId,
  TelemetryEventId,
  UserId,
  VivaAttemptId
} from "../value-objects/ids";
import type { UrlString } from "../value-objects/primitives";
import type { DurationMinutes, ISODateTimeString, ScoreValue, TimeRange } from "../value-objects/time";

export type SessionActorReference = {
  actorType: ActorType;
  userId?: UserId;
  label?: string;
};

export type Session = AuditFields & {
  id: SessionId;
  userId: UserId;
  profileId: ProfileId;
  contractId: ContractId;
  title: string;
  objective: string;
  state: SessionState;
  plannedRange: TimeRange;
  startedAt?: ISODateTimeString;
  endedAt?: ISODateTimeString;
  reviewRequestedAt?: ISODateTimeString;
  validMinutes: DurationMinutes;
  invalidMinutes: DurationMinutes;
  warningCount: number;
  missedCheckpointCount: number;
  finalArtifactRequired: boolean;
  blockIds: readonly SessionBlockId[];
  checkpointIds: readonly CheckpointId[];
  artifactIds: readonly ArtifactId[];
  evaluationIds: readonly EvaluationId[];
  vivaAttemptIds: readonly VivaAttemptId[];
  penaltyIds: readonly PenaltyId[];
  notes?: string;
  metadata?: MetadataMap;
};

export type SessionBlock = AuditFields & {
  id: SessionBlockId;
  sessionId: SessionId;
  type: SessionBlockType;
  range: TimeRange;
  sourceEventId?: SessionEventId;
  creditedMinutes: DurationMinutes;
  notes?: string;
};

export type SessionEvent = {
  id: SessionEventId;
  sessionId: SessionId;
  type: SessionEventType;
  actor: SessionActorReference;
  state?: SessionState;
  occurredAt: ISODateTimeString;
  details?: MetadataMap;
};

export type TelemetryEvent = {
  id: TelemetryEventId;
  userId: UserId;
  sessionId?: SessionId;
  source: TelemetrySource;
  type: TelemetryEventType;
  occurredAt: ISODateTimeString;
  receivedAt: ISODateTimeString;
  payload: MetadataMap;
};

export type Checkpoint = AuditFields & {
  id: CheckpointId;
  sessionId: SessionId;
  order: number;
  title: string;
  status: CheckpointStatus;
  dueAt: ISODateTimeString;
  completedAt?: ISODateTimeString;
  artifactId?: ArtifactId;
  evaluationId?: EvaluationId;
  notes?: string;
};

export type Artifact = AuditFields & {
  id: ArtifactId;
  sessionId: SessionId;
  type: ArtifactType;
  source: ArtifactSource;
  status: ArtifactStatus;
  title: string;
  description?: string;
  isMandatory: boolean;
  createdByUserId?: UserId;
  submittedAt?: ISODateTimeString;
  mediaType?: string;
  uri?: UrlString;
  metadata?: MetadataMap;
};

export type Evaluation = AuditFields & {
  id: EvaluationId;
  sessionId: SessionId;
  type: EvaluationType;
  status: EvaluationStatus;
  evaluator: ActorType;
  artifactId?: ArtifactId;
  checkpointId?: CheckpointId;
  vivaAttemptId?: VivaAttemptId;
  evaluatedAt?: ISODateTimeString;
  score?: ScoreValue;
  notes?: string;
  evidenceArtifactIds: readonly ArtifactId[];
};

export type VivaAttempt = AuditFields & {
  id: VivaAttemptId;
  sessionId: SessionId;
  promptTemplateId?: PromptTemplateId;
  status: VivaAttemptStatus;
  scheduledAt?: ISODateTimeString;
  startedAt?: ISODateTimeString;
  completedAt?: ISODateTimeString;
  transcriptArtifactId?: ArtifactId;
  evaluationId?: EvaluationId;
  score?: ScoreValue;
  passingScore?: ScoreValue;
  notes?: string;
};

export type Penalty = AuditFields & {
  id: PenaltyId;
  userId: UserId;
  contractId?: ContractId;
  sessionId?: SessionId;
  type: PenaltyType;
  reason: PenaltyReason;
  status: PenaltyStatus;
  issuedAt: ISODateTimeString;
  expiresAt?: ISODateTimeString;
  resolvedAt?: ISODateTimeString;
  notes?: string;
  metadata?: MetadataMap;
};
