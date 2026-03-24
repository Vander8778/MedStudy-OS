import type { AuditFields } from "../value-objects/common";
import type { MasteryTrackId, UserId } from "../value-objects/ids";
import type { EntityCode } from "../value-objects/primitives";
import type { ISODateTimeString, Percentage } from "../value-objects/time";
import type { MasteryTrackStatus } from "@medstudy/contracts";

export type MasteryTrack = AuditFields & {
  id: MasteryTrackId;
  userId: UserId;
  key: EntityCode;
  name: string;
  description?: string;
  status: MasteryTrackStatus;
  currentLevel: number;
  maxLevel: number;
  progressPercent: Percentage;
  lastEvaluatedAt?: ISODateTimeString;
};
