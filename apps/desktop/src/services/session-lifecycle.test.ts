import { describe, expect, it } from "vitest";
import {
  getSessionContextSyncDecision,
  getTelemetrySyncDecision
} from "./session-lifecycle";

describe("session lifecycle decisions", () => {
  it("skips session-context sync until hydration completes", () => {
    expect(
      getSessionContextSyncDecision({
        isHydrated: false,
        authUserId: "user_1",
        sessionId: "session_1",
        sessionUserId: "user_1",
        sessionState: "active_valid"
      })
    ).toEqual({ action: "skip" });
  });

  it("persists only hydrated non-terminal sessions", () => {
    expect(
      getSessionContextSyncDecision({
        isHydrated: true,
        authUserId: "user_1",
        sessionId: "session_1",
        sessionUserId: "user_1",
        sessionState: "active_valid"
      })
    ).toEqual({
      action: "persist",
      sessionId: "session_1",
      userId: "user_1"
    });

    expect(
      getSessionContextSyncDecision({
        isHydrated: true,
        authUserId: "user_1",
        sessionId: "session_1",
        sessionUserId: "user_1",
        sessionState: "completed"
      })
    ).toEqual({ action: "clear" });
  });

  it("maps telemetry sync to heartbeat-only capture for paused states", () => {
    expect(
      getTelemetrySyncDecision({
        authUserId: "user_1",
        sessionId: "session_1",
        sessionState: "paused_valid"
      })
    ).toEqual({
      action: "start",
      sessionId: "session_1",
      userId: "user_1",
      captureMode: "heartbeat_only"
    });

    expect(
      getTelemetrySyncDecision({
        authUserId: "user_1",
        sessionId: "session_1",
        sessionState: "review_pending"
      })
    ).toEqual({ action: "stop" });
  });
});
