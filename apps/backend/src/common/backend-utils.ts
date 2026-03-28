import { randomUUID } from "crypto";

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value);
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  return JSON.parse(value) as T;
}

export function toDate(value: string): Date {
  return new Date(value);
}

export function fromDate(value?: Date | null): string | undefined {
  return value ? value.toISOString() : undefined;
}
