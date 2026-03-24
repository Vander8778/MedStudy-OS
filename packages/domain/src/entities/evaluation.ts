import type { AuditFields } from "../value-objects/common";
import type { ActorType, EvaluationStatus, EvaluationType } from "@medstudy/contracts";
import type { ArtifactId, CheckpointId, EvaluationId, SessionId, VivaAttemptId } from "../value-objects/ids";
import type { ISODateTimeString, ScoreValue } from "../value-objects/time";

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
