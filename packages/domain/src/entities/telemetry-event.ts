import type { MetadataMap } from "../value-objects/common";
import type { TelemetryEventType, TelemetrySource } from "@medstudy/contracts";
import type { SessionId, TelemetryEventId, UserId } from "../value-objects/ids";
import type { ISODateTimeString } from "../value-objects/time";

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
