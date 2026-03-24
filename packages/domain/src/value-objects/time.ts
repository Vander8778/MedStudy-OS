import type { Brand } from "./primitives";

export type DurationMinutes = Brand<number, "DurationMinutes">;
export type ISODateString = Brand<string, "ISODateString">;
export type ISODateTimeString = Brand<string, "ISODateTimeString">;
export type Percentage = Brand<number, "Percentage">;
export type ScoreValue = Brand<number, "ScoreValue">;

export type TimeRange = {
  startsAt: ISODateTimeString;
  endsAt: ISODateTimeString;
};
