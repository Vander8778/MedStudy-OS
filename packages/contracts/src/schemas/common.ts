import { z } from "zod";

export const nonEmptyStringSchema = z.string().trim().min(1);
export const emailAddressSchema = z.string().trim().email();
export const entityCodeSchema = nonEmptyStringSchema;
export const isoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const isoDateTimeStringSchema = z.string().datetime({ offset: true });
export const localeCodeSchema = nonEmptyStringSchema;
export const metadataSchema = z.record(z.unknown());
export const timezoneNameSchema = nonEmptyStringSchema;
export const urlStringSchema = z.string().url();

export const durationMinutesSchema = z.number().nonnegative();
export const percentageSchema = z.number().min(0).max(100);
export const scoreValueSchema = z.number().min(0).max(100);

export const auditFieldsSchema = z.object({
  createdAt: isoDateTimeStringSchema,
  updatedAt: isoDateTimeStringSchema
});

export const timeRangeSchema = z.object({
  startsAt: isoDateTimeStringSchema,
  endsAt: isoDateTimeStringSchema
}).refine((range) => Date.parse(range.endsAt) > Date.parse(range.startsAt), {
  message: "endsAt must be after startsAt"
});
