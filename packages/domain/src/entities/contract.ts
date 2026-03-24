import type { AuditFields, MetadataMap } from "../value-objects/common";
import type { ContractTerms } from "../value-objects/contract-terms";
import type { ContractStatus } from "../value-objects/enums";
import type { ContractId, UserId } from "../value-objects/ids";
import type { ISODateTimeString, TimeRange } from "../value-objects/time";

export type Contract = AuditFields & {
  id: ContractId;
  userId: UserId;
  name: string;
  description?: string;
  status: ContractStatus;
  terms: ContractTerms;
  activeRange: TimeRange;
  signedAt?: ISODateTimeString;
  activatedAt?: ISODateTimeString;
  endedAt?: ISODateTimeString;
  tags: readonly string[];
  metadata?: MetadataMap;
};
