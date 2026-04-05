import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "./session-store";
import { shouldRunPolling } from "../utils/polling";

describe("session store and polling helpers", () => {
  beforeEach(() => {
    useSessionStore.getState().invalidate();
  });

  it("invalidates cached session state cleanly", () => {
    useSessionStore.setState({
      homeSummary: {
        activeSession: null,
        plannedSession: null,
        dueCheckpoints: [],
        recentResults: [],
        progress: null
      },
      currentSession: null,
      scoring: null,
      events: [],
      results: [],
      isLoading: false,
      error: undefined,
      lastFetchedAt: "2026-04-05T10:00:00.000Z",
      cacheState: "fresh"
    });

    useSessionStore.getState().invalidate();
    expect(useSessionStore.getState().homeSummary).toBeNull();
    expect(useSessionStore.getState().cacheState).toBe("missing");
  });

  it("stops polling when backgrounded or unfocused", () => {
    expect(
      shouldRunPolling({ enabled: true, isFocused: true, appState: "active" })
    ).toBe(true);
    expect(
      shouldRunPolling({ enabled: true, isFocused: false, appState: "active" })
    ).toBe(false);
    expect(
      shouldRunPolling({ enabled: true, isFocused: true, appState: "background" })
    ).toBe(false);
  });
});
