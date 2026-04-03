import type { SessionState } from "@medstudy/contracts";
import {
  getTelemetryCaptureMode,
  isTerminalSessionState,
  type TelemetryCaptureMode
} from "../types";

export type SessionContextSyncDecision =
  | { action: "skip" }
  | { action: "clear" }
  | {
      action: "persist";
      sessionId: string;
      userId: string;
    };

export type TelemetrySyncDecision =
  | { action: "stop" }
  | {
      action: "start";
      sessionId: string;
      userId: string;
      captureMode: TelemetryCaptureMode;
    };

export function getSessionContextSyncDecision(input: {
  isHydrated: boolean;
  authUserId?: string;
  sessionId?: string;
  sessionUserId?: string;
  sessionState?: SessionState;
}): SessionContextSyncDecision {
  if (!input.isHydrated) {
    return { action: "skip" };
  }

  if (
    !input.authUserId ||
    !input.sessionId ||
    !input.sessionUserId ||
    !input.sessionState
  ) {
    return { action: "clear" };
  }

  if (isTerminalSessionState(input.sessionState)) {
    return { action: "clear" };
  }

  return {
    action: "persist",
    sessionId: input.sessionId,
    userId: input.sessionUserId
  };
}

export function getTelemetrySyncDecision(input: {
  authUserId?: string;
  sessionId?: string;
  sessionState?: SessionState;
}): TelemetrySyncDecision {
  if (!input.authUserId || !input.sessionId || !input.sessionState) {
    return { action: "stop" };
  }

  const captureMode = getTelemetryCaptureMode(input.sessionState);
  if (!captureMode) {
    return { action: "stop" };
  }

  return {
    action: "start",
    sessionId: input.sessionId,
    userId: input.authUserId,
    captureMode
  };
}
