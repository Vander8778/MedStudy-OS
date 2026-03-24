import type { AuditFields } from "../value-objects/common";
import type { AvatarId, ProfileId, UserId } from "../value-objects/ids";
import type { EmailAddress, LocaleCode, TimezoneName } from "../value-objects/primitives";
import type { ProfileStudyStage, UserRole, UserStatus } from "@medstudy/contracts";

export type User = AuditFields & {
  id: UserId;
  email: EmailAddress;
  role: UserRole;
  status: UserStatus;
};

export type Profile = AuditFields & {
  id: ProfileId;
  userId: UserId;
  displayName: string;
  timezone: TimezoneName;
  locale: LocaleCode;
  studyStage: ProfileStudyStage;
  institutionName?: string;
  graduationYear?: number;
  avatarId?: AvatarId;
  biography?: string;
};
