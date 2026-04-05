import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { useAuthStore } from "./auth-store";

const completeCheckpointMock = vi.fn();

vi.mock("../services/mobile-api", () => ({
  getMobileApiClient: () => ({
    getCurrentSessionSummary: vi.fn(),
    getSession: vi.fn(),
    getScoring: vi.fn(),
    getEvents: vi.fn(),
    getResults: vi.fn(),
    submitArtifactPayload: vi.fn(),
    completeCheckpoint: completeCheckpointMock
  })
}));

import { useSessionStore } from "./session-store";
import { shouldRunPolling } from "../utils/polling";

describe("session store and polling helpers", () => {
  beforeEach(() => {
    useSessionStore.getState().invalidate();
    useAuthStore.setState({
      session: {
        tokens: {
          accessToken: "access",
          refreshToken: "refresh"
        },
        user: {
          id: "user_1",
          email: "demo@example.com",
          role: "student",
          status: "active",
          createdAt: "2026-04-05T10:00:00.000Z",
          updatedAt: "2026-04-05T10:00:00.000Z"
        }
      },
      isHydrating: false,
      isLoading: false,
      error: undefined
    });
    completeCheckpointMock.mockReset();
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

  it("rolls back an optimistic checkpoint update when the api rejects it", async () => {
    const session = {
      session: {
        id: "session_1",
        userId: "user_1",
        profileId: "profile_1",
        contractId: "contract_1",
        title: "Cardiology Focus",
        objective: "Review rhythm strips",
        state: "active_valid",
        plannedRange: {
          startsAt: "2026-04-05T10:00:00.000Z",
          endsAt: "2026-04-05T11:00:00.000Z"
        },
        validMinutes: 35,
        invalidMinutes: 5,
        warningCount: 1,
        missedCheckpointCount: 0,
        finalArtifactRequired: true,
        createdAt: "2026-04-05T09:00:00.000Z",
        updatedAt: "2026-04-05T10:35:00.000Z"
      },
      contract: {
        id: "contract_1",
        userId: "user_1",
        name: "Core Contract",
        status: "active",
        terms: {
          minValidMinutes: 45,
          maxMissedCheckpoints: 1,
          mandatoryArtifactTypes: ["final_submission"],
          vivaPassingScore: 70
        },
        activeRange: {
          startsAt: "2026-04-01T00:00:00.000Z",
          endsAt: "2026-05-01T00:00:00.000Z"
        },
        tags: [],
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z"
      },
      checkpoints: [
        {
          id: "checkpoint_1",
          sessionId: "session_1",
          order: 0,
          title: "Explain next step",
          status: "due",
          dueAt: "2026-04-05T10:40:00.000Z",
          createdAt: "2026-04-05T10:00:00.000Z",
          updatedAt: "2026-04-05T10:00:00.000Z"
        }
      ],
      artifacts: [],
      vivaAttempts: [],
      blocks: [],
      penalties: []
    } as const;

    useSessionStore.setState({
      homeSummary: null,
      currentSession: session as never,
      scoring: null,
      events: [],
      results: [],
      isLoading: false,
      error: undefined,
      lastFetchedAt: undefined,
      cacheState: "fresh"
    });

    completeCheckpointMock.mockRejectedValueOnce(new Error("Rejected"));

    await expect(
      useSessionStore
        .getState()
        .completeCheckpoint("session_1", "checkpoint_1", "done", true)
    ).rejects.toThrow("Rejected");

    expect(useSessionStore.getState().currentSession).toEqual(session);
    expect((completeCheckpointMock as Mock).mock.calls[0]?.[2]).toMatchObject({
      note: "done"
    });
  });
});
