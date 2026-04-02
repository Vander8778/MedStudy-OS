import type { SessionState } from "@medstudy/contracts";
import { describe, expect, it } from "vitest";
import {
  getCheckpointPrompt,
  getCurrentScreen,
  getEffectiveSessionState,
  shouldPersistSessionContext,
  useSessionStore
} from "./session-store";

function createSession(state: SessionState) {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Focus Block",
      objective: "Review cardiology notes",
      state,
      plannedRange: {
        startsAt: "2026-04-02T10:00:00.000Z",
        endsAt: "2026-04-02T11:00:00.000Z"
      },
      validMinutes: 10,
      invalidMinutes: 0,
      warningCount: 0,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      createdAt: "2026-04-02T09:50:00.000Z",
      updatedAt: "2026-04-02T10:05:00.000Z"
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
        title: "Checkpoint",
        status: "due",
        dueAt: "2026-04-02T10:20:00.000Z",
        createdAt: "2026-04-02T10:00:00.000Z",
        updatedAt: "2026-04-02T10:00:00.000Z"
      }
    ],
    artifacts: [],
    vivaAttempts: [],
    blocks: [],
    penalties: []
  } as const;
}

describe("session store helpers", () => {
  it("uses optimistic state until the backend truth diverges", () => {
    const session = createSession("active_valid");

    expect(getEffectiveSessionState(session as never, "paused_valid")).toBe(
      "paused_valid"
    );

    useSessionStore.setState({
      auth: {
        token: "stub",
        user: {
          id: "user_1",
          email: "demo@medstudy.local",
          role: "student"
        }
      },
      session: null,
      scoring: null,
      events: [],
      config: null,
      lastSyncedAtMs: undefined,
      sessionDraft: useSessionStore.getState().sessionDraft,
      restoreSessionId: "",
      optimisticState: "paused_valid"
    });
    useSessionStore.getState().setSession(session as never);

    expect(useSessionStore.getState().optimisticState).toBeUndefined();
  });

  it("maps backend session states to the correct screen", () => {
    expect(
      getCurrentScreen({
        auth: null,
        session: null,
        optimisticState: undefined
      } as never)
    ).toBe("login");
    expect(
      getCurrentScreen({
        auth: {
          token: "stub",
          user: {
            id: "user_1",
            email: "demo@medstudy.local",
            role: "student"
          }
        },
        session: createSession("review_pending"),
        optimisticState: undefined
      } as never)
    ).toBe("review");
    expect(
      getCurrentScreen({
        auth: {
          token: "stub",
          user: {
            id: "user_1",
            email: "demo@medstudy.local",
            role: "student"
          }
        },
        session: createSession("penalized"),
        optimisticState: undefined
      } as never)
    ).toBe("completed");
  });

  it("surfaces due checkpoints from the backend snapshot", () => {
    const prompt = getCheckpointPrompt(createSession("active_valid") as never);

    expect(prompt?.id).toBe("checkpoint_1");
  });

  it("persists only non-terminal session contexts", () => {
    expect(shouldPersistSessionContext(createSession("active_valid").session)).toBe(
      true
    );
    expect(shouldPersistSessionContext(createSession("completed").session)).toBe(
      false
    );
  });
});
