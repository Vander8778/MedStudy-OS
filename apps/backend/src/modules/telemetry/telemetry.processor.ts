import { Injectable } from "@nestjs/common";
import { analyzeAvoidance, type AntiAvoidanceInput } from "@medstudy/domain";
import { SessionOrchestrator } from "../session/session.orchestrator";
import { SessionRepository } from "../session/session.repository";
import {
  CreateTelemetryEventCommand,
  TelemetryRepository
} from "./telemetry.repository";

@Injectable()
export class TelemetryProcessor {
  constructor(
    private readonly telemetryRepository: TelemetryRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionOrchestrator: SessionOrchestrator
  ) {}

  private buildAvoidanceInput(
    aggregate: Awaited<ReturnType<SessionRepository["findSessionAggregateOrThrow"]>>,
    payload: Record<string, unknown>
  ): AntiAvoidanceInput {
    return {
      session: {
        state: aggregate.session.state,
        plannedDurationMinutes:
          (Date.parse(aggregate.session.plannedRange.endsAt) -
            Date.parse(aggregate.session.plannedRange.startsAt)) /
          60000,
        elapsedMinutes: Math.max(
          (Date.now() -
            Date.parse(aggregate.session.startedAt ?? aggregate.session.createdAt)) /
            60000,
          0
        ),
        validMinutes: aggregate.session.validMinutes,
        invalidMinutes: aggregate.session.invalidMinutes,
        warningCount: aggregate.session.warningCount,
        missedCheckpointCount: aggregate.session.missedCheckpointCount,
        currentWarningActive: aggregate.session.state === "active_warning",
        currentWarningDurationMinutes: typeof payload.currentWarningDurationMinutes === "number"
          ? payload.currentWarningDurationMinutes
          : 0
      },
      behavior: {
        idleMinutes: typeof payload.idleMinutes === "number" ? payload.idleMinutes : 0,
        longestIdleStretchMinutes:
          typeof payload.longestIdleStretchMinutes === "number"
            ? payload.longestIdleStretchMinutes
            : 0,
        contextSwitchCount:
          typeof payload.contextSwitchCount === "number" ? payload.contextSwitchCount : 0,
        nonStudyContextMinutes:
          typeof payload.nonStudyContextMinutes === "number"
            ? payload.nonStudyContextMinutes
            : 0,
        nonStudyContextDetected: payload.nonStudyContextDetected === true,
        inputActivityLevel:
          payload.inputActivityLevel === "none" ||
          payload.inputActivityLevel === "minimal" ||
          payload.inputActivityLevel === "normal"
            ? payload.inputActivityLevel
            : "normal"
      },
      history: {
        warningRecoveryCount:
          typeof payload.warningRecoveryCount === "number" ? payload.warningRecoveryCount : 0,
        warningEscalationCount:
          typeof payload.warningEscalationCount === "number" ? payload.warningEscalationCount : 0,
        armingAttemptCount:
          typeof payload.armingAttemptCount === "number" ? payload.armingAttemptCount : 0,
        armingCancelCount:
          typeof payload.armingCancelCount === "number" ? payload.armingCancelCount : 0,
        previousSessionAvoidanceCount:
          typeof payload.previousSessionAvoidanceCount === "number"
            ? payload.previousSessionAvoidanceCount
            : 0
      },
      thresholds: {
        idleStretchWarningMinutes:
          typeof payload.idleStretchWarningMinutes === "number"
            ? payload.idleStretchWarningMinutes
            : 5,
        idleStretchCriticalMinutes:
          typeof payload.idleStretchCriticalMinutes === "number"
            ? payload.idleStretchCriticalMinutes
            : 15,
        idleTotalWarningMinutes:
          typeof payload.idleTotalWarningMinutes === "number"
            ? payload.idleTotalWarningMinutes
            : 10,
        contextSwitchWarningCount:
          typeof payload.contextSwitchWarningCount === "number"
            ? payload.contextSwitchWarningCount
            : 4,
        contextSwitchCriticalCount:
          typeof payload.contextSwitchCriticalCount === "number"
            ? payload.contextSwitchCriticalCount
            : 8,
        nonStudyContextWarningMinutes:
          typeof payload.nonStudyContextWarningMinutes === "number"
            ? payload.nonStudyContextWarningMinutes
            : 3,
        nonStudyContextCriticalMinutes:
          typeof payload.nonStudyContextCriticalMinutes === "number"
            ? payload.nonStudyContextCriticalMinutes
            : 10,
        warningCycleEscalationCount:
          typeof payload.warningCycleEscalationCount === "number"
            ? payload.warningCycleEscalationCount
            : 3,
        armingCancelEscalationCount:
          typeof payload.armingCancelEscalationCount === "number"
            ? payload.armingCancelEscalationCount
            : 3,
        stalledStartMinutes:
          typeof payload.stalledStartMinutes === "number" ? payload.stalledStartMinutes : 10
      }
    };
  }

  async ingestEvent(command: CreateTelemetryEventCommand) {
    const record = await this.telemetryRepository.create(command);

    if (!command.sessionId) {
      return { telemetryEvent: record, antiAvoidance: null };
    }

    const aggregate = await this.sessionRepository.findSessionAggregateOrThrow(command.sessionId);
    const input = this.buildAvoidanceInput(aggregate, command.payload);
    const antiAvoidance = analyzeAvoidance(input);

    if (
      antiAvoidance.recommendedResponses.includes("raise_warning") ||
      antiAvoidance.recommendedResponses.includes("escalate_to_review") ||
      antiAvoidance.recommendedResponses.includes("flag_for_admin")
    ) {
      await this.sessionOrchestrator.processAvoidanceAssessment(command.sessionId, antiAvoidance);
    }

    return { telemetryEvent: record, antiAvoidance };
  }
}
