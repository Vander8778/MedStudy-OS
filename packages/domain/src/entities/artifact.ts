import type { AuditFields, MetadataMap } from "../value-objects/common";
import type { ArtifactSource, ArtifactStatus, ArtifactType } from "@medstudy/contracts";
import type { ArtifactId, SessionId, UserId } from "../value-objects/ids";
import type { UrlString } from "../value-objects/primitives";
import type { ISODateTimeString } from "../value-objects/time";

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
