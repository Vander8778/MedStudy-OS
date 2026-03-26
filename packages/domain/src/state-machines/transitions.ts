import type { SessionState } from "@medstudy/contracts";

export type SessionMachineEventType =
  | "arming_started"
  | "armed"
  | "started"
  | "warning_raised"
  | "resumed"
  | "paused"
  | "review_requested"
  | "completed"
  | "partial"
  | "failed"
  | "penalized"
  | "excused"
  | "cancel"
  | "abort"
  | "timeout";

export type SessionTransitionMap = Readonly<
  Record<SessionState, Partial<Record<SessionMachineEventType, readonly SessionState[]>>>
>;

export const SESSION_TRANSITION_MAP: SessionTransitionMap = {
  planned: {
    arming_started: ["arming"]
  },
  arming: {
    armed: ["armed"],
    cancel: ["planned"],
    abort: ["planned"]
  },
  armed: {
    started: ["active_valid"]
  },
  active_valid: {
    warning_raised: ["active_warning"],
    paused: ["paused_valid"],
    review_requested: ["review_pending"]
  },
  active_warning: {
    resumed: ["active_valid"],
    timeout: ["invalid_block"],
    review_requested: ["review_pending"]
  },
  paused_valid: {
    resumed: ["active_valid"],
    timeout: ["paused_expired"]
  },
  paused_expired: {
    review_requested: ["review_pending"]
  },
  invalid_block: {
    resumed: ["active_valid"],
    review_requested: ["review_pending"]
  },
  review_pending: {
    completed: ["completed"],
    partial: ["partial"],
    failed: ["failed"],
    excused: ["excused"]
  },
  completed: {},
  partial: {},
  failed: {
    penalized: ["penalized"],
    excused: ["excused"]
  },
  penalized: {
    excused: ["excused"]
  },
  excused: {}
} as const;
