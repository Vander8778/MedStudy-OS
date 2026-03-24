import type { AuditFields, MetadataMap } from "../value-objects/common";
import type {
  ArtifactId,
  CheckpointId,
  ContractId,
  EvaluationId,
  PenaltyId,
  ProfileId,
  SessionBlockId,
  SessionEventId,
  SessionId,
  UserId,
  VivaAttemptId
} from "../value-objects/ids";
import type { DurationMinutes, ISODateTimeString, TimeRange } from "../value-objects/time";
import type {
  ActorType,
  SessionBlockType,
  SessionEventType,
  SessionState
} from "@medstudy/contracts";

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
