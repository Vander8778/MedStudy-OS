import type { ISODateTimeString } from "./time";

export type AuditFields = {
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type MetadataMap = Readonly<Record<string, unknown>>;
