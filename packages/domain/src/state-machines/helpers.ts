import type { SessionState } from "@medstudy/contracts";

export const TERMINAL_SESSION_STATES: readonly SessionState[] = [
  "completed",
  "partial",
  "penalized",
  "excused"
] as const;

export const OUTCOME_DECIDED_STATES: readonly SessionState[] = [
  "completed",
  "partial",
  "failed",
  "penalized",
  "excused"
] as const;

export const ACTIVE_SESSION_STATES: readonly SessionState[] = [
  "active_valid",
  "active_warning"
] as const;

export const PAUSED_SESSION_STATES: readonly SessionState[] = [
  "paused_valid",
  "paused_expired"
] as const;

export function isTerminalState(state: SessionState): boolean {
  return TERMINAL_SESSION_STATES.includes(state);
}

export function isOutcomeDecided(state: SessionState): boolean {
  return OUTCOME_DECIDED_STATES.includes(state);
}

export function isActiveState(state: SessionState): boolean {
  return ACTIVE_SESSION_STATES.includes(state);
}

export function isPausedState(state: SessionState): boolean {
  return PAUSED_SESSION_STATES.includes(state);
}
