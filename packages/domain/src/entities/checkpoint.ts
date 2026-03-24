import type { AuditFields } from "../value-objects/common";
import type { CheckpointStatus } from "@medstudy/contracts";
import type { ArtifactId, CheckpointId, EvaluationId, SessionId } from "../value-objects/ids";
import type { ISODateTimeString } from "../value-objects/time";

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
