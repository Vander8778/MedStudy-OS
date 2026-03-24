import type { AuditFields, MetadataMap } from "../value-objects/common";
import type { NotificationId, UserId } from "../value-objects/ids";
import type { ISODateTimeString } from "../value-objects/time";
import type { NotificationChannel, NotificationStatus, NotificationType } from "@medstudy/contracts";

export type Notification = AuditFields & {
  id: NotificationId;
  userId: UserId;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  scheduledAt?: ISODateTimeString;
  sentAt?: ISODateTimeString;
  readAt?: ISODateTimeString;
  data?: MetadataMap;
};
