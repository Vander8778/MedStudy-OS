import type { ActorType } from "@medstudy/contracts";
import type { SessionMachineGuard } from "./session-machine";

export function isAdminActor(actorType?: ActorType): boolean {
  return actorType === "admin";
}

export const canStartSession: SessionMachineGuard = (session, event) =>
  event.type === "started" &&
  Date.parse(event.occurredAt) >= Date.parse(session.plannedRange.startsAt);

export const canCancelArming: SessionMachineGuard = (_session, event) =>
  event.type === "cancel" || event.type === "abort";

export const canPause: SessionMachineGuard = (_session, event, contract, context) => {
  if (event.type !== "paused") {
    return false;
  }

  if (contract.terms.maxPauseMinutes === undefined) {
    return true;
  }

  const totalPause = context.totalPauseDuration ?? 0;
  return totalPause < contract.terms.maxPauseMinutes;
};

export const canResumeFromWarning: SessionMachineGuard = (_session, event, _contract, context) =>
  event.type === "resumed" &&
  event.reason === "warning_resolved" &&
  context.warningResolvedInGraceWindow === true;

export const canExpireWarningGraceWindow: SessionMachineGuard = (_session, event) =>
  event.type === "timeout" && event.reason === "warning_grace_expired";

export const canResumeFromPause: SessionMachineGuard = (_session, event, _contract, context) =>
  event.type === "resumed" &&
  event.reason === "pause_within_limit" &&
  context.pauseWithinLimit === true;

export const canExpirePauseLimit: SessionMachineGuard = (_session, event) =>
  event.type === "timeout" && event.reason === "pause_limit_exceeded";

export const canResumeFromInvalidBlock: SessionMachineGuard = (_session, event, _contract, context) =>
  event.type === "resumed" &&
  (event.reason === "manual_clear" || event.reason === "admin_clear") &&
  context.invalidBlockCleared === true;

export const canExcuseByAdmin: SessionMachineGuard = (_session, event) =>
  event.type === "excused" && isAdminActor(event.actorType);
