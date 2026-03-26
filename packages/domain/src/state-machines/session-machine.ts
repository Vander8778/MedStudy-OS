import type {
  DomainEvent,
  SessionState,
  SessionStateChangedEvent
} from "@medstudy/contracts";
import type { Contract, Session } from "../entities";
import {
  canCancelArming,
  canPause,
  canExcuseByAdmin,
  canExpirePauseLimit,
  canExpireWarningGraceWindow,
  canStartSession,
  canResumeFromInvalidBlock,
  canResumeFromPause,
  canResumeFromWarning
} from "./guards";
import { SESSION_TRANSITION_MAP, type SessionMachineEventType } from "./transitions";

export type ResumeReason = "warning_resolved" | "pause_within_limit" | "manual_clear" | "admin_clear";
export type TimeoutReason = "warning_grace_expired" | "pause_limit_exceeded";

type BaseSessionMachineEvent = {
  id: string;
  occurredAt: Session["createdAt"];
  actorType?: "user" | "system" | "admin" | "ai_assistant";
};

export type SessionMachineEvent =
  | (BaseSessionMachineEvent & {
      type:
        | "arming_started"
        | "armed"
        | "started"
        | "warning_raised"
        | "paused"
        | "review_requested"
        | "completed"
        | "partial"
        | "failed"
        | "penalized";
    })
  | (BaseSessionMachineEvent & {
      type: "resumed";
      reason?: ResumeReason;
    })
  | (BaseSessionMachineEvent & {
      type: "timeout";
      reason: TimeoutReason;
    })
  | (BaseSessionMachineEvent & {
      type: "cancel" | "abort";
    })
  | {
      id: string;
      type: "excused";
      occurredAt: Session["createdAt"];
      actorType: "user" | "system" | "admin" | "ai_assistant";
    };

export type SessionMachineContext = {
  now?: Session["createdAt"];
  warningResolvedInGraceWindow?: boolean;
  pauseWithinLimit?: boolean;
  totalPauseDuration?: Session["validMinutes"];
  invalidBlockCleared?: boolean;
};

export type SessionMachineGuard = (
  session: Session,
  event: SessionMachineEvent,
  contract: Contract,
  context: SessionMachineContext
) => boolean;

export type SessionTransitionSuccess = {
  ok: true;
  session: Session;
  fromState: SessionState;
  toState: SessionState;
  event: SessionMachineEvent;
  domainEvents: readonly DomainEvent[];
};

export type SessionTransitionFailureCode = "EVENT_NOT_ALLOWED" | "GUARD_FAILED";

export type SessionTransitionFailure = {
  ok: false;
  session: Session;
  fromState: SessionState;
  event: SessionMachineEvent;
  code: SessionTransitionFailureCode;
  reason: string;
};

export type SessionTransitionResult = SessionTransitionSuccess | SessionTransitionFailure;

type GuardKey = `${SessionState}:${SessionMachineEventType}`;

const SESSION_TRANSITION_GUARDS: Partial<Record<GuardKey, SessionMachineGuard>> = {
  "arming:cancel": canCancelArming,
  "arming:abort": canCancelArming,
  "armed:started": canStartSession,
  "active_valid:paused": canPause,
  "active_warning:resumed": canResumeFromWarning,
  "active_warning:timeout": canExpireWarningGraceWindow,
  "paused_valid:resumed": canResumeFromPause,
  "paused_valid:timeout": canExpirePauseLimit,
  "invalid_block:resumed": canResumeFromInvalidBlock,
  "review_pending:excused": canExcuseByAdmin,
  "failed:excused": canExcuseByAdmin,
  "penalized:excused": canExcuseByAdmin
};

function buildGuardKey(state: SessionState, eventType: SessionMachineEventType): GuardKey {
  return `${state}:${eventType}`;
}

function getAllowedTargets(
  state: SessionState,
  eventType: SessionMachineEventType
): readonly SessionState[] | undefined {
  return SESSION_TRANSITION_MAP[state][eventType];
}

function getTransitionGuard(
  state: SessionState,
  eventType: SessionMachineEventType
): SessionMachineGuard | undefined {
  return SESSION_TRANSITION_GUARDS[buildGuardKey(state, eventType)];
}

function createStateChangedEvent(
  session: Session,
  event: SessionMachineEvent,
  toState: SessionState
): SessionStateChangedEvent {
  return {
    id: `${event.id}:state_changed`,
    type: "session.state_changed",
    occurredAt: event.occurredAt,
    sessionId: session.id,
    userId: session.userId,
    fromState: session.state,
    toState
  };
}

function createPrimaryDomainEvent(
  session: Session,
  event: SessionMachineEvent,
  toState: SessionState
): DomainEvent | null {
  const base = {
    id: `${event.id}:primary`,
    occurredAt: event.occurredAt,
    sessionId: session.id,
    userId: session.userId
  } as const;

  switch (event.type) {
    case "started":
      return { ...base, type: "session.started" };
    case "warning_raised":
      return { ...base, type: "session.warning_raised" };
    case "paused":
      return { ...base, type: "session.paused" };
    case "resumed":
      if (session.state === "active_warning") {
        return { ...base, type: "session.warning_cleared" };
      }
      return { ...base, type: "session.resumed" };
    case "completed":
      return { ...base, type: "session.completed" };
    case "partial":
      return { ...base, type: "session.partial" };
    case "failed":
      return { ...base, type: "session.failed" };
    case "penalized":
      return { ...base, type: "session.penalized" };
    case "excused":
      return { ...base, type: "session.excused" };
    case "timeout":
      if (toState === "invalid_block") {
        return { ...base, type: "session.invalid_block_started" };
      }
      return null;
    case "review_requested":
      if (toState === "review_pending") {
        return { ...base, type: "session.review_started" };
      }
      return null;
    default:
      return null;
  }
}

function createDomainEvents(
  session: Session,
  event: SessionMachineEvent,
  toState: SessionState
): readonly DomainEvent[] {
  const stateChangedEvent = createStateChangedEvent(session, event, toState);
  const primaryEvent = createPrimaryDomainEvent(session, event, toState);

  return primaryEvent ? [stateChangedEvent, primaryEvent] : [stateChangedEvent];
}

// The state machine owns deterministic session-field mutations that can be derived directly
// from the transition event itself. Duration-based counters such as invalidMinutes require
// an explicit delta in the event/context surface and are intentionally left unchanged here
// until that input exists in the approved contract.
function applyTransitionEffects(
  session: Session,
  event: SessionMachineEvent,
  toState: SessionState
): Session {
  let nextSession: Session = {
    ...session,
    state: toState,
    updatedAt: event.occurredAt
  };

  if (event.type === "started") {
    nextSession = {
      ...nextSession,
      startedAt: session.startedAt ?? event.occurredAt
    };
  }

  if (event.type === "warning_raised") {
    nextSession = {
      ...nextSession,
      warningCount: session.warningCount + 1
    };
  }

  if (event.type === "review_requested" && toState === "review_pending") {
    nextSession = {
      ...nextSession,
      endedAt: session.endedAt ?? event.occurredAt,
      reviewRequestedAt: event.occurredAt
    };
  }

  if (
    (event.type === "completed" ||
      event.type === "partial" ||
      event.type === "failed" ||
      event.type === "excused") &&
    !nextSession.endedAt
  ) {
    nextSession = {
      ...nextSession,
      endedAt: event.occurredAt
    };
  }

  return nextSession;
}

export function transition(
  session: Session,
  event: SessionMachineEvent,
  contract: Contract,
  context: SessionMachineContext
): SessionTransitionResult {
  const allowedTargets = getAllowedTargets(session.state, event.type);

  if (!allowedTargets || allowedTargets.length === 0) {
    return {
      ok: false,
      session,
      fromState: session.state,
      event,
      code: "EVENT_NOT_ALLOWED",
      reason: `Event "${event.type}" is not allowed from state "${session.state}".`
    };
  }

  const guard = getTransitionGuard(session.state, event.type);

  if (guard && !guard(session, event, contract, context)) {
    return {
      ok: false,
      session,
      fromState: session.state,
      event,
      code: "GUARD_FAILED",
      reason: `Guard conditions failed for event "${event.type}" from state "${session.state}".`
    };
  }

  const toState = allowedTargets[0];
  const nextSession = applyTransitionEffects(session, event, toState);

  return {
    ok: true,
    session: nextSession,
    fromState: session.state,
    toState,
    event,
    domainEvents: createDomainEvents(session, event, toState)
  };
}
