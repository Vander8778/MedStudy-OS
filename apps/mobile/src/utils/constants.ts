export const MOBILE_API_BASE_URL = "http://127.0.0.1:3000/api";

export const POLL_INTERVALS = {
  homeMs: 60_000,
  sessionDetailMs: 30_000
} as const;

export const CACHE_POLICY = {
  staleAfterMs: 24 * 60 * 60 * 1_000,
  expiredAfterMs: 7 * 24 * 60 * 60 * 1_000
} as const;

export const OFFLINE_QUEUE = {
  maxRetries: 3
} as const;

export const ARTIFACT_LIMITS = {
  maxFileSizeBytes: 8 * 1024 * 1024
} as const;

export const APP_VERSION = "0.1.0-m12";
