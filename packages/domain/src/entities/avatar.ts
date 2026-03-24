import type { AuditFields } from "../value-objects/common";
import type { AvatarRarity, AvatarUnlockSource } from "../value-objects/enums";
import type { AvatarId, AvatarUnlockId, UserId } from "../value-objects/ids";
import type { EntityCode, UrlString } from "../value-objects/primitives";
import type { ISODateTimeString } from "../value-objects/time";

export type Avatar = AuditFields & {
  id: AvatarId;
  code: EntityCode;
  name: string;
  description?: string;
  rarity: AvatarRarity;
  imageUrl?: UrlString;
  isDefault: boolean;
};

export type AvatarUnlock = AuditFields & {
  id: AvatarUnlockId;
  userId: UserId;
  avatarId: AvatarId;
  source: AvatarUnlockSource;
  unlockedAt: ISODateTimeString;
};
