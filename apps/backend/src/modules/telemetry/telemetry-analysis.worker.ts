import { Injectable } from "@nestjs/common";
import {
  analyzeAvoidance,
  isActiveState,
  isTerminalState,
  type AntiAvoidanceInput,
  type AntiAvoidanceResult
} from "@medstudy/domain";
import type { SessionAggregate } from "../session/session.repository";
import { SessionOrchestrator } from "../session/session.orchestrator";
import { SessionRepository } from "../session/session.repository";
import { buildTelemetrySummary } from "./telemetry-summary.builder";
import {
  TelemetryRepository,
  type TelemetrySummaryRecord
} from "./telemetry.repository";

const DEFAULT_AVOIDANCE_THRESHOLDS = {
  idleStretchWarningMinutes: 5,
  idleStretchCriticalMinutes: 15,
  idleTotalWarningMinutes: 10,
  contextSwitchWarningCount: 4,
  contextSwitchCriticalCount: 8,
  nonStudyContextWarningMinutes: 3,
  nonStudyContextCriticalMinutes: 10,
  warningCycleEscalationCount: 3,
  armingCancelEscalationCount: 3,
  stalledStartMinutes: 10
} as const;

export type TelemetryAnalysisRunResult =
  | {
      status: "processed";
      deregister: false;
      summary: TelemetrySummaryRecord;
      assessment: AntiAvoidanceResult;
    }
  | {
      status: "skipped";
      deregister: boolean;
      reason: "already_running" | "non_active_state" | "terminal_state";
    }
  | {
      status: "no_new_events";
      deregister: false;
    };

@Injectable()
export class TelemetryAnalysisWorker {
  private readonly runningSessions = new Set<string>();

  constructor(
    private readonly telemetryRepository: TelemetryRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionOrchestrator: SessionOrchestrator
  ) {}

  private getCurrentWarningDurationMinutes(
    aggregate: SessionAggregate,
    asOf: string
  ) {
    if (aggregate.session.state !== "active_warning") {
      return 0;
    }

    const latestWarningRaised = [...aggregate.events]
      .reverse()
      .find((event) => event.type === "warning_raised");

    if (!latestWarningRaised) {
      return 0;
    }

    return Math.max(
      (Date.parse(asOf) - Date.parse(latestWarningRaised.occurredAt)) / 60000,
      0
    );
  }

  private buildAvoidanceInput(
    aggregate: SessionAggregate,
    summary: TelemetrySummaryRecord,
    history: {
      warningRecoveryCount: number;
      warningEscalationCount: number;
      armingAttemptCount: number;
      armingCancelCount: number;
      previousSessionAvoidanceCount: number;
    }
  ): AntiAvoidanceInput {
    return {
      session: {
        state: aggregate.session.state,
        plannedDurationMinutes:
          (Date.parse(aggregate.session.plannedRange.endsAt) -
            Date.parse(aggregate.session.plannedRange.startsAt)) /
          60000,
        elapsedMinutes: summary.sessionElapsedMinutes,
        validMinutes: aggregate.session.validMinutes,
        invalidMinutes: aggregate.session.invalidMinutes,
        warningCount: aggregate.session.warningCount,
        missedCheckpointCount: aggregate.session.missedCheckpointCount,
        currentWarningActive: summary.currentWarningActive,
        currentWarningDurationMinutes: summary.currentWarningDurationMinutes
      },
      behavior: {
        idleMinutes: summary.idleMinutes,
        longestIdleStretchMinutes: summary.longestIdleStretchMinutes,
        contextSwitchCount: summary.contextSwitchCount,
        nonStudyContextMinutes: summary.nonStudyContextMinutes,
        nonStudyContextDetected: summary.nonStudyContextDetected,
        inputActivityLevel: summary.inputActivityLevel
      },
      history,
      thresholds: DEFAULT_AVOIDANCE_THRESHOLDS
    };
  }

  private async buildAvoidanceHistory(aggregate: SessionAggregate) {
    return {
      warningRecoveryCount: aggregate.events.filter(
        (event) =>
          event.type === "resumed" &&
          event.details !== undefined &&
          event.details.reason === "warning_resolved"
      ).length,
      warningEscalationCount: aggregate.events.filter(
        (event) =>
          event.type === "review_requested" &&
          event.actor.label === "avoidance.escalate_to_review"
      ).length,
      armingAttemptCount: aggregate.events.filter(
        (event) => event.type === "arming_started"
      ).length,
      armingCancelCount: aggregate.events.filter(
        (event) => event.type === "cancel" || event.type === "abort"
      ).length,
      previousSessionAvoidanceCount:
        await this.telemetryRepository.countPreviousSessionAvoidanceResults(
          aggregate.session.userId,
          aggregate.session.id
        )
    };
  }

  private isActionable(result: AntiAvoidanceResult) {
    return (
      result.recommendedResponses.includes("raise_warning") ||
      result.recommendedResponses.includes("escalate_to_review") ||
      result.recommendedResponses.includes("flag_for_admin")
    );
  }

  async processSessionAnalysis(
    sessionId: string
  ): Promise<TelemetryAnalysisRunResult> {
    if (this.runningSessions.has(sessionId)) {
      return {
        status: "skipped",
        deregister: false,
        reason: "already_running"
      };
    }

    this.runningSessions.add(sessionId);

    try {
      const aggregate = await this.sessionRepository.findSessionAggregateOrThrow(sessionId);

      if (isTerminalState(aggregate.session.state)) {
        return {
          status: "skipped",
          deregister: true,
          reason: "terminal_state"
        };
      }

      if (!isActiveState(aggregate.session.state)) {
        return {
          status: "skipped",
          deregister: true,
          reason: "non_active_state"
        };
      }

      const checkpoint = await this.telemetryRepository.getOrCreateCheckpoint(sessionId);
      const rawEvents = await this.telemetryRepository.findEventsSinceCheckpoint(
        sessionId,
        checkpoint
      );

      if (rawEvents.length === 0) {
        return {
          status: "no_new_events",
          deregister: false
        };
      }

      const summary = buildTelemetrySummary({
        session: {
          id: aggregate.session.id,
          state: aggregate.session.state,
          startedAt: aggregate.session.startedAt,
          createdAt: aggregate.session.createdAt,
          validMinutes: aggregate.session.validMinutes,
          invalidMinutes: aggregate.session.invalidMinutes,
          warningCount: aggregate.session.warningCount,
          missedCheckpointCount: aggregate.session.missedCheckpointCount,
          currentWarningDurationMinutes: this.getCurrentWarningDurationMinutes(
            aggregate,
            rawEvents[rawEvents.length - 1].serverReceivedAt
          )
        },
        rawEvents,
        now: rawEvents[rawEvents.length - 1].serverReceivedAt,
        windowStartsAt:
          checkpoint.lastAnalyzedAt ?? rawEvents[0].serverReceivedAt
      });

      await this.telemetryRepository.saveSummary(summary);

      const history = await this.buildAvoidanceHistory(aggregate);
      const assessment = analyzeAvoidance(
        this.buildAvoidanceInput(aggregate, summary, history)
      );

      if (this.isActionable(assessment)) {
        await this.sessionOrchestrator.processAvoidanceAssessment(
          sessionId,
          assessment
        );
      }

      await this.telemetryRepository.advanceCheckpoint(sessionId, {
        lastProcessedRawEventId: rawEvents[rawEvents.length - 1].id,
        lastAnalyzedAt: rawEvents[rawEvents.length - 1].serverReceivedAt
      });

      return {
        status: "processed",
        deregister: false,
        summary,
        assessment
      };
    } finally {
      this.runningSessions.delete(sessionId);
    }
  }
}
