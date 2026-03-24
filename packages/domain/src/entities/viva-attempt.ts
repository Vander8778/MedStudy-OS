import type { AuditFields } from "../value-objects/common";
import type { VivaAttemptStatus } from "@medstudy/contracts";
import type { ArtifactId, EvaluationId, PromptTemplateId, SessionId, VivaAttemptId } from "../value-objects/ids";
import type { ISODateTimeString, ScoreValue } from "../value-objects/time";

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
