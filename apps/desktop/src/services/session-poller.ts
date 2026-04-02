import type { SessionState } from "@medstudy/contracts";

export function getSessionPollIntervalMs(
  state: SessionState | undefined,
  basePollIntervalMs: number
) {
  switch (state) {
    case "active_warning":
    case "invalid_block":
      return 2_000;
    case "active_valid":
      return basePollIntervalMs;
    case "paused_valid":
    case "paused_expired":
      return 10_000;
    case "review_pending":
      return 4_000;
    default:
      return 0;
  }
}

export function shouldPollSession(state: SessionState | undefined) {
  return state !== undefined && getSessionPollIntervalMs(state, 5_000) > 0;
}
