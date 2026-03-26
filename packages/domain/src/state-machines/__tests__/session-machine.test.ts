import { describe, expect, it } from "vitest";
import type { Contract, Session } from "../../entities";
import {
  isActiveState,
  isOutcomeDecided,
  isPausedState,
  isTerminalState
} from "../helpers";
import {
  transition,
  type SessionMachineEvent,
  type SessionTransitionFailure,
  type SessionTransitionSuccess
} from "../session-machine";
import { SESSION_TRANSITION_MAP } from "../transitions";

function createContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: "contract_1" as Contract["id"],
    userId: "user_1" as Contract["userId"],
    name: "Core contract",
    status: "active",
    terms: {
      minValidMinutes: 60 as Contract["terms"]["minValidMinutes"],
      maxMissedCheckpoints: 1,
      mandatoryArtifactTypes: ["final_submission"],
      vivaPassingScore: 70 as Contract["terms"]["vivaPassingScore"]
    },
    activeRange: {
      startsAt: "2026-03-26T09:00:00+03:00" as Contract["activeRange"]["startsAt"],
      endsAt: "2026-03-26T12:00:00+03:00" as Contract["activeRange"]["endsAt"]
    },
    tags: [],
    createdAt: "2026-03-26T08:00:00+03:00" as Contract["createdAt"],
    updatedAt: "2026-03-26T08:00:00+03:00" as Contract["updatedAt"],
    ...overrides
  };
}

function createSession(state: Session["state"], overrides: Partial<Session> = {}): Session {
  return {
    id: "session_1" as Session["id"],
    userId: "user_1" as Session["userId"],
    profileId: "profile_1" as Session["profileId"],
    contractId: "contract_1" as Session["contractId"],
    title: "State machine test session",
    objective: "Validate state transitions",
    state,
    plannedRange: {
      startsAt: "2026-03-26T09:00:00+03:00" as Session["plannedRange"]["startsAt"],
      endsAt: "2026-03-26T11:00:00+03:00" as Session["plannedRange"]["endsAt"]
    },
    validMinutes: 0 as Session["validMinutes"],
    invalidMinutes: 0 as Session["invalidMinutes"],
    warningCount: 0,
    missedCheckpointCount: 0,
    finalArtifactRequired: true,
    blockIds: [],
    checkpointIds: [],
    artifactIds: [],
    evaluationIds: [],
    vivaAttemptIds: [],
    penaltyIds: [],
    createdAt: "2026-03-26T08:55:00+03:00" as Session["createdAt"],
    updatedAt: "2026-03-26T08:55:00+03:00" as Session["updatedAt"],
    ...overrides
  };
}

function createEvent(event: SessionMachineEvent): SessionMachineEvent {
  return event;
}

function expectSuccess(result: ReturnType<typeof transition>): SessionTransitionSuccess {
  expect(result.ok).toBe(true);
  return result as SessionTransitionSuccess;
}

function expectFailure(result: ReturnType<typeof transition>): SessionTransitionFailure {
  expect(result.ok).toBe(false);
  return result as SessionTransitionFailure;
}

describe("SESSION_TRANSITION_MAP", () => {
  it("requires review_pending before completion outcomes", () => {
    expect(SESSION_TRANSITION_MAP.active_valid.completed).toBeUndefined();
    expect(SESSION_TRANSITION_MAP.active_valid.failed).toBeUndefined();
    expect(SESSION_TRANSITION_MAP.review_pending.completed).toEqual(["completed"]);
    expect(SESSION_TRANSITION_MAP.review_pending.partial).toEqual(["partial"]);
    expect(SESSION_TRANSITION_MAP.review_pending.failed).toEqual(["failed"]);
  });
});

describe("happy path", () => {
  it("supports planned -> arming -> armed -> active_valid -> review_pending -> completed", () => {
    const contract = createContract();

    const armingResult = expectSuccess(
      transition(
        createSession("planned"),
        createEvent({
          id: "evt_arming_started",
          type: "arming_started",
          occurredAt: "2026-03-26T09:00:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    const armedResult = expectSuccess(
      transition(
        armingResult.session,
        createEvent({
          id: "evt_armed",
          type: "armed",
          occurredAt: "2026-03-26T09:01:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    const startedResult = expectSuccess(
      transition(
        armedResult.session,
        createEvent({
          id: "evt_started",
          type: "started",
          occurredAt: "2026-03-26T09:05:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    const reviewRequestedResult = expectSuccess(
      transition(
        startedResult.session,
        createEvent({
          id: "evt_review_requested",
          type: "review_requested",
          occurredAt: "2026-03-26T10:45:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    const completedResult = expectSuccess(
      transition(
        reviewRequestedResult.session,
        createEvent({
          id: "evt_completed",
          type: "completed",
          occurredAt: "2026-03-26T10:50:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(completedResult.toState).toBe("completed");
    expect(startedResult.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.started"
    ]);
    expect(startedResult.session.startedAt).toBe("2026-03-26T09:05:00+03:00");
    expect(startedResult.session.updatedAt).toBe("2026-03-26T09:05:00+03:00");
    expect(reviewRequestedResult.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.review_started"
    ]);
    expect(reviewRequestedResult.session.reviewRequestedAt).toBe("2026-03-26T10:45:00+03:00");
    expect(reviewRequestedResult.session.endedAt).toBe("2026-03-26T10:45:00+03:00");
    expect(reviewRequestedResult.session.updatedAt).toBe("2026-03-26T10:45:00+03:00");
    expect(completedResult.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.completed"
    ]);
    expect(completedResult.session.endedAt).toBe("2026-03-26T10:45:00+03:00");
    expect(completedResult.session.updatedAt).toBe("2026-03-26T10:50:00+03:00");
  });
});

describe("warning flow", () => {
  const contract = createContract();

  it("transitions active_valid -> active_warning", () => {
    const result = expectSuccess(
      transition(
        createSession("active_valid"),
        createEvent({
          id: "evt_warning_raised",
          type: "warning_raised",
          occurredAt: "2026-03-26T09:15:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("active_warning");
    expect(result.session.warningCount).toBe(1);
    expect(result.session.updatedAt).toBe("2026-03-26T09:15:00+03:00");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.warning_raised"
    ]);
  });

  it("transitions active_warning -> active_valid on recovery", () => {
    const result = expectSuccess(
      transition(
        createSession("active_warning"),
        createEvent({
          id: "evt_warning_resumed",
          type: "resumed",
          reason: "warning_resolved",
          occurredAt: "2026-03-26T09:20:00+03:00" as Session["createdAt"]
        }),
        contract,
        { warningResolvedInGraceWindow: true }
      )
    );

    expect(result.toState).toBe("active_valid");
    expect(result.session.updatedAt).toBe("2026-03-26T09:20:00+03:00");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.warning_cleared"
    ]);
  });

  it("transitions active_warning -> invalid_block on timeout", () => {
    const result = expectSuccess(
      transition(
        createSession("active_warning"),
        createEvent({
          id: "evt_warning_timeout",
          type: "timeout",
          reason: "warning_grace_expired",
          occurredAt: "2026-03-26T09:25:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("invalid_block");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.invalid_block_started"
    ]);
  });

  it("increments warningCount across repeated warning cycles", () => {
    const firstWarning = expectSuccess(
      transition(
        createSession("active_valid", { warningCount: 0 }),
        createEvent({
          id: "evt_warning_first",
          type: "warning_raised",
          occurredAt: "2026-03-26T09:10:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    const recovered = expectSuccess(
      transition(
        firstWarning.session,
        createEvent({
          id: "evt_warning_first_cleared",
          type: "resumed",
          reason: "warning_resolved",
          occurredAt: "2026-03-26T09:12:00+03:00" as Session["createdAt"]
        }),
        contract,
        { warningResolvedInGraceWindow: true }
      )
    );

    const secondWarning = expectSuccess(
      transition(
        recovered.session,
        createEvent({
          id: "evt_warning_second",
          type: "warning_raised",
          occurredAt: "2026-03-26T09:14:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(firstWarning.session.warningCount).toBe(1);
    expect(recovered.session.warningCount).toBe(1);
    expect(secondWarning.session.warningCount).toBe(2);
  });
});

describe("pause flow", () => {
  const contract = createContract();

  it("transitions active_valid -> paused_valid", () => {
    const result = expectSuccess(
      transition(
        createSession("active_valid"),
        createEvent({
          id: "evt_paused",
          type: "paused",
          occurredAt: "2026-03-26T09:30:00+03:00" as Session["createdAt"]
        }),
        contract,
        { totalPauseDuration: 5 as Session["validMinutes"] }
      )
    );

    expect(result.toState).toBe("paused_valid");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.paused"
    ]);
  });

  it("transitions paused_valid -> active_valid", () => {
    const result = expectSuccess(
      transition(
        createSession("paused_valid"),
        createEvent({
          id: "evt_pause_resumed",
          type: "resumed",
          reason: "pause_within_limit",
          occurredAt: "2026-03-26T09:35:00+03:00" as Session["createdAt"]
        }),
        contract,
        { pauseWithinLimit: true }
      )
    );

    expect(result.toState).toBe("active_valid");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.resumed"
    ]);
  });

  it("transitions paused_valid -> paused_expired", () => {
    const result = expectSuccess(
      transition(
        createSession("paused_valid"),
        createEvent({
          id: "evt_pause_timeout",
          type: "timeout",
          reason: "pause_limit_exceeded",
          occurredAt: "2026-03-26T09:45:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("paused_expired");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed"
    ]);
  });

  it("transitions paused_expired -> review_pending on review_requested", () => {
    const result = expectSuccess(
      transition(
        createSession("paused_expired"),
        createEvent({
          id: "evt_pause_expired_review",
          type: "review_requested",
          occurredAt: "2026-03-26T09:50:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("review_pending");
    expect(result.session.reviewRequestedAt).toBe("2026-03-26T09:50:00+03:00");
    expect(result.session.endedAt).toBe("2026-03-26T09:50:00+03:00");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.review_started"
    ]);
  });
});

describe("arming cancellation flow", () => {
  const contract = createContract();

  it("transitions arming -> planned on cancel", () => {
    const result = expectSuccess(
      transition(
        createSession("arming"),
        createEvent({
          id: "evt_cancel",
          type: "cancel",
          occurredAt: "2026-03-26T09:02:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("planned");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed"
    ]);
  });

  it("transitions arming -> planned on abort", () => {
    const result = expectSuccess(
      transition(
        createSession("arming"),
        createEvent({
          id: "evt_abort",
          type: "abort",
          occurredAt: "2026-03-26T09:03:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("planned");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed"
    ]);
  });
});

describe("invalid block recovery flow", () => {
  const contract = createContract();

  it("transitions invalid_block -> active_valid when admin-cleared", () => {
    const result = expectSuccess(
      transition(
        createSession("invalid_block"),
        createEvent({
          id: "evt_invalid_block_admin_clear",
          type: "resumed",
          reason: "admin_clear",
          occurredAt: "2026-03-26T09:40:00+03:00" as Session["createdAt"]
        }),
        contract,
        { invalidBlockCleared: true }
      )
    );

    expect(result.toState).toBe("active_valid");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.resumed"
    ]);
  });
});

describe("review flow", () => {
  const contract = createContract();

  it("transitions review_pending -> completed", () => {
    const result = expectSuccess(
      transition(
        createSession("review_pending"),
        createEvent({
          id: "evt_completed",
          type: "completed",
          occurredAt: "2026-03-26T10:00:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("completed");
    expect(result.session.endedAt).toBe("2026-03-26T10:00:00+03:00");
  });

  it("transitions review_pending -> partial", () => {
    const result = expectSuccess(
      transition(
        createSession("review_pending"),
        createEvent({
          id: "evt_partial",
          type: "partial",
          occurredAt: "2026-03-26T10:01:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("partial");
    expect(result.session.endedAt).toBe("2026-03-26T10:01:00+03:00");
  });

  it("transitions review_pending -> failed", () => {
    const result = expectSuccess(
      transition(
        createSession("review_pending"),
        createEvent({
          id: "evt_failed",
          type: "failed",
          occurredAt: "2026-03-26T10:02:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("failed");
    expect(result.session.endedAt).toBe("2026-03-26T10:02:00+03:00");
  });
});

describe("penalty and admin flow", () => {
  const contract = createContract();

  it("transitions failed -> penalized", () => {
    const result = expectSuccess(
      transition(
        createSession("failed"),
        createEvent({
          id: "evt_penalized",
          type: "penalized",
          occurredAt: "2026-03-26T10:10:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("penalized");
    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.penalized"
    ]);
  });

  it("transitions review_pending -> excused", () => {
    const result = expectSuccess(
      transition(
        createSession("review_pending"),
        createEvent({
          id: "evt_excused_review",
          type: "excused",
          actorType: "admin",
          occurredAt: "2026-03-26T10:11:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("excused");
  });

  it("transitions failed -> excused", () => {
    const result = expectSuccess(
      transition(
        createSession("failed"),
        createEvent({
          id: "evt_excused_failed",
          type: "excused",
          actorType: "admin",
          occurredAt: "2026-03-26T10:12:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("excused");
  });

  it("transitions penalized -> excused", () => {
    const result = expectSuccess(
      transition(
        createSession("penalized"),
        createEvent({
          id: "evt_excused_penalized",
          type: "excused",
          actorType: "admin",
          occurredAt: "2026-03-26T10:13:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("excused");
  });
});

describe("invalid transitions", () => {
  const contract = createContract();

  it("rejects planned -> active_valid", () => {
    const result = expectFailure(
      transition(
        createSession("planned"),
        createEvent({
          id: "evt_invalid_start",
          type: "started",
          occurredAt: "2026-03-26T09:10:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("rejects armed -> paused_valid", () => {
    const result = expectFailure(
      transition(
        createSession("armed"),
        createEvent({
          id: "evt_invalid_pause",
          type: "paused",
          occurredAt: "2026-03-26T09:10:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("rejects paused_expired -> active_valid", () => {
    const result = expectFailure(
      transition(
        createSession("paused_expired"),
        createEvent({
          id: "evt_invalid_resume_expired",
          type: "resumed",
          reason: "pause_within_limit",
          occurredAt: "2026-03-26T09:50:00+03:00" as Session["createdAt"]
        }),
        contract,
        { pauseWithinLimit: true }
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("rejects review_pending -> active_valid", () => {
    const result = expectFailure(
      transition(
        createSession("review_pending"),
        createEvent({
          id: "evt_invalid_review_resume",
          type: "resumed",
          reason: "pause_within_limit",
          occurredAt: "2026-03-26T10:00:00+03:00" as Session["createdAt"]
        }),
        contract,
        { pauseWithinLimit: true }
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("rejects active_valid -> completed", () => {
    const result = expectFailure(
      transition(
        createSession("active_valid"),
        createEvent({
          id: "evt_invalid_completed",
          type: "completed",
          occurredAt: "2026-03-26T10:00:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });
});

describe("terminal state protection", () => {
  const contract = createContract();

  it("rejects transitions from completed", () => {
    const result = expectFailure(
      transition(
        createSession("completed"),
        createEvent({
          id: "evt_completed_resume",
          type: "resumed",
          reason: "pause_within_limit",
          occurredAt: "2026-03-26T10:15:00+03:00" as Session["createdAt"]
        }),
        contract,
        { pauseWithinLimit: true }
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("rejects transitions from partial", () => {
    const result = expectFailure(
      transition(
        createSession("partial"),
        createEvent({
          id: "evt_partial_resume",
          type: "resumed",
          reason: "pause_within_limit",
          occurredAt: "2026-03-26T10:16:00+03:00" as Session["createdAt"]
        }),
        contract,
        { pauseWithinLimit: true }
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("rejects transitions from excused", () => {
    const result = expectFailure(
      transition(
        createSession("excused"),
        createEvent({
          id: "evt_excused_resume",
          type: "resumed",
          reason: "pause_within_limit",
          occurredAt: "2026-03-26T10:17:00+03:00" as Session["createdAt"]
        }),
        contract,
        { pauseWithinLimit: true }
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("rejects unrelated outbound transitions from failed", () => {
    const result = expectFailure(
      transition(
        createSession("failed"),
        createEvent({
          id: "evt_failed_resume",
          type: "resumed",
          reason: "pause_within_limit",
          occurredAt: "2026-03-26T10:19:00+03:00" as Session["createdAt"]
        }),
        contract,
        { pauseWithinLimit: true }
      )
    );

    expect(result.code).toBe("EVENT_NOT_ALLOWED");
  });

  it("allows penalized -> excused as the sole exception", () => {
    const result = expectSuccess(
      transition(
        createSession("penalized"),
        createEvent({
          id: "evt_penalized_excused",
          type: "excused",
          actorType: "admin",
          occurredAt: "2026-03-26T10:18:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.toState).toBe("excused");
  });
});

describe("guard failures", () => {
  const contract = createContract();

  it("rejects start before plannedRange.startsAt", () => {
    const result = expectFailure(
      transition(
        createSession("armed", {
          plannedRange: {
            startsAt: "2026-03-26T09:00:00+03:00" as Session["plannedRange"]["startsAt"],
            endsAt: "2026-03-26T11:00:00+03:00" as Session["plannedRange"]["endsAt"]
          }
        }),
        createEvent({
          id: "evt_started_too_early",
          type: "started",
          occurredAt: "2026-03-26T08:59:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.code).toBe("GUARD_FAILED");
  });

  it("rejects pause when the total pause is already over the limit", () => {
    const result = expectFailure(
      transition(
        createSession("active_valid"),
        createEvent({
          id: "evt_pause_rejected",
          type: "paused",
          occurredAt: "2026-03-26T10:20:00+03:00" as Session["createdAt"]
        }),
        createContract({
          terms: {
            ...contract.terms,
            maxPauseMinutes: 10 as Contract["terms"]["maxPauseMinutes"]
          }
        }),
        { totalPauseDuration: 10 as Session["validMinutes"] }
      )
    );

    expect(result.code).toBe("GUARD_FAILED");
  });

  it("rejects excused without admin", () => {
    const result = expectFailure(
      transition(
        createSession("review_pending"),
        createEvent({
          id: "evt_excused_non_admin",
          type: "excused",
          actorType: "user",
          occurredAt: "2026-03-26T10:21:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.code).toBe("GUARD_FAILED");
  });
});

describe("transition invariants", () => {
  const contract = createContract();

  it("keeps missedCheckpointCount monotonic across transitions that do not modify it", () => {
    const session = createSession("active_valid", { missedCheckpointCount: 2 });
    const result = expectSuccess(
      transition(
        session,
        createEvent({
          id: "evt_review_from_active_valid",
          type: "review_requested",
          occurredAt: "2026-03-26T10:30:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.session.missedCheckpointCount).toBe(2);
  });

  it("keeps valid and invalid time credit unchanged when no explicit delta is provided", () => {
    const session = createSession("active_warning", {
      validMinutes: 40 as Session["validMinutes"],
      invalidMinutes: 7 as Session["invalidMinutes"]
    });
    const result = expectSuccess(
      transition(
        session,
        createEvent({
          id: "evt_warning_timeout_invariant",
          type: "timeout",
          reason: "warning_grace_expired",
          occurredAt: "2026-03-26T10:31:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.session.validMinutes).toBe(40);
    expect(result.session.invalidMinutes).toBe(7);
  });

  it("emits state_changed before the primary domain event with matching from/to states", () => {
    const session = createSession("active_valid");
    const result = expectSuccess(
      transition(
        session,
        createEvent({
          id: "evt_warning_consistency",
          type: "warning_raised",
          occurredAt: "2026-03-26T10:32:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.domainEvents.map((event) => event.type)).toEqual([
      "session.state_changed",
      "session.warning_raised"
    ]);
    expect(result.domainEvents[0]).toMatchObject({
      type: "session.state_changed",
      fromState: "active_valid",
      toState: "active_warning"
    });
  });

  it("uses event.occurredAt as the causal timestamp for session mutation and domain events", () => {
    const result = expectSuccess(
      transition(
        createSession("armed"),
        createEvent({
          id: "evt_started_causal",
          type: "started",
          occurredAt: "2026-03-26T09:05:00+03:00" as Session["createdAt"]
        }),
        contract,
        {}
      )
    );

    expect(result.session.startedAt).toBe("2026-03-26T09:05:00+03:00");
    expect(result.session.updatedAt).toBe("2026-03-26T09:05:00+03:00");
    expect(
      result.domainEvents.every((event) => event.occurredAt === "2026-03-26T09:05:00+03:00")
    ).toBe(true);
  });
});

describe("state helpers", () => {
  it("classifies active, paused, terminal, and outcome-decided states", () => {
    expect(isActiveState("active_valid")).toBe(true);
    expect(isActiveState("active_warning")).toBe(true);
    expect(isPausedState("paused_valid")).toBe(true);
    expect(isPausedState("paused_expired")).toBe(true);
    expect(isTerminalState("completed")).toBe(true);
    expect(isTerminalState("partial")).toBe(true);
    expect(isTerminalState("penalized")).toBe(true);
    expect(isTerminalState("excused")).toBe(true);
    expect(isTerminalState("active_valid")).toBe(false);
    expect(isTerminalState("failed")).toBe(false);
    expect(isOutcomeDecided("completed")).toBe(true);
    expect(isOutcomeDecided("partial")).toBe(true);
    expect(isOutcomeDecided("failed")).toBe(true);
    expect(isOutcomeDecided("penalized")).toBe(true);
    expect(isOutcomeDecided("excused")).toBe(true);
    expect(isOutcomeDecided("active_valid")).toBe(false);
  });
});
