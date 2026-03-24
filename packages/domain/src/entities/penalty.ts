import type { AuditFields, MetadataMap } from "../value-objects/common";
import type { PenaltyReason, PenaltyStatus, PenaltyType } from "@medstudy/contracts";
import type { ContractId, PenaltyId, SessionId, UserId } from "../value-objects/ids";
import type { ISODateTimeString } from "../value-objects/time";

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
