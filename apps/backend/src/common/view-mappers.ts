import type {
  ArtifactView,
  ComponentScoreView,
  ContractEvaluationSummaryView,
  ContractResponse,
  ContractSummaryView,
  GetEventsResponse,
  GetScoringResponse,
  GetSessionResponse,
  IngestTelemetryResponse,
  PenaltyView,
  ReviewResultResponse,
  ScoringResultView,
  SessionAggregateResponse,
  SessionBlockView,
  SessionEventView,
  SessionMutationResponse,
  SessionView,
  SubmitArtifactResponse,
  TimeRangeView,
  VivaAttemptView,
  CheckpointView
} from "@medstudy/contracts";
import type {
  Artifact,
  Contract,
  ContractEvaluationResult,
  Penalty,
  ScoringResult,
  Session,
  SessionBlock,
  SessionEvent,
  VivaAttempt,
  Checkpoint,
  AntiAvoidanceResult
} from "@medstudy/domain";
import type { SessionAggregate } from "../modules/session/session.repository";

export function mapTimeRangeView(range: { startsAt: string; endsAt: string }): TimeRangeView {
  return {
    startsAt: range.startsAt,
    endsAt: range.endsAt
  };
}

export function mapSessionView(session: Session): SessionView {
  return {
    id: session.id,
    userId: session.userId,
    profileId: session.profileId,
    contractId: session.contractId,
    title: session.title,
    objective: session.objective,
    state: session.state,
    plannedRange: mapTimeRangeView(session.plannedRange),
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    reviewRequestedAt: session.reviewRequestedAt,
    validMinutes: session.validMinutes,
    invalidMinutes: session.invalidMinutes,
    warningCount: session.warningCount,
    missedCheckpointCount: session.missedCheckpointCount,
    finalArtifactRequired: session.finalArtifactRequired,
    notes: session.notes,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

export function mapContractSummaryView(contract: Contract): ContractSummaryView {
  return {
    id: contract.id,
    userId: contract.userId,
    name: contract.name,
    description: contract.description,
    status: contract.status,
    terms: contract.terms,
    activeRange: mapTimeRangeView(contract.activeRange),
    signedAt: contract.signedAt,
    activatedAt: contract.activatedAt,
    endedAt: contract.endedAt,
    tags: [...contract.tags],
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt
  };
}

export function mapCheckpointView(checkpoint: Checkpoint): CheckpointView {
  return {
    id: checkpoint.id,
    sessionId: checkpoint.sessionId,
    order: checkpoint.order,
    title: checkpoint.title,
    status: checkpoint.status,
    dueAt: checkpoint.dueAt,
    completedAt: checkpoint.completedAt,
    artifactId: checkpoint.artifactId,
    evaluationId: checkpoint.evaluationId,
    notes: checkpoint.notes,
    createdAt: checkpoint.createdAt,
    updatedAt: checkpoint.updatedAt
  };
}

export function mapArtifactView(artifact: Artifact): ArtifactView {
  return {
    id: artifact.id,
    sessionId: artifact.sessionId,
    type: artifact.type,
    source: artifact.source,
    status: artifact.status,
    title: artifact.title,
    description: artifact.description,
    isMandatory: artifact.isMandatory,
    createdByUserId: artifact.createdByUserId,
    submittedAt: artifact.submittedAt,
    uri: artifact.uri,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt
  };
}

export function mapVivaAttemptView(vivaAttempt: VivaAttempt): VivaAttemptView {
  return {
    id: vivaAttempt.id,
    sessionId: vivaAttempt.sessionId,
    status: vivaAttempt.status,
    scheduledAt: vivaAttempt.scheduledAt,
    startedAt: vivaAttempt.startedAt,
    completedAt: vivaAttempt.completedAt,
    score: vivaAttempt.score,
    passingScore: vivaAttempt.passingScore,
    notes: vivaAttempt.notes,
    createdAt: vivaAttempt.createdAt,
    updatedAt: vivaAttempt.updatedAt
  };
}

export function mapSessionBlockView(block: SessionBlock): SessionBlockView {
  return {
    id: block.id,
    sessionId: block.sessionId,
    type: block.type,
    range: mapTimeRangeView(block.range),
    sourceEventId: block.sourceEventId,
    creditedMinutes: block.creditedMinutes,
    notes: block.notes,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt
  };
}

export function mapPenaltyView(penalty: Penalty): PenaltyView {
  return {
    id: penalty.id,
    userId: penalty.userId,
    contractId: penalty.contractId,
    sessionId: penalty.sessionId,
    type: penalty.type,
    reason: penalty.reason,
    status: penalty.status,
    issuedAt: penalty.issuedAt,
    expiresAt: penalty.expiresAt,
    resolvedAt: penalty.resolvedAt,
    notes: penalty.notes,
    createdAt: penalty.createdAt,
    updatedAt: penalty.updatedAt
  };
}

export function mapSessionEventView(event: SessionEvent): SessionEventView {
  return {
    id: event.id,
    sessionId: event.sessionId,
    type: event.type,
    actor: {
      actorType: event.actor.actorType,
      userId: event.actor.userId,
      label: event.actor.label
    },
    state: event.state,
    occurredAt: event.occurredAt,
    details: event.details
  };
}

export function mapComponentScoreView(component: {
  raw: number | null;
  weight: number;
  weighted: number;
}): ComponentScoreView {
  return {
    raw: component.raw,
    weight: component.weight,
    weighted: component.weighted
  };
}

export function mapScoringResultView(scoring: ScoringResult): ScoringResultView {
  return {
    outcome: scoring.outcome,
    sessionScore: scoring.sessionScore,
    components: {
      validTime: mapComponentScoreView(scoring.components.validTime),
      process: mapComponentScoreView(scoring.components.process),
      artifact: mapComponentScoreView(scoring.components.artifact),
      knowledge: mapComponentScoreView(scoring.components.knowledge)
    },
    hardFailTriggered: scoring.hardFail.triggered,
    hardFailReasons: [...scoring.hardFail.reasons],
    decisionTrace: {
      decidedByHardFail: scoring.decisionTrace.decidedByHardFail,
      scoreThresholdApplied: scoring.decisionTrace.scoreThresholdApplied
    }
  };
}

export function mapContractEvaluationSummaryView(
  evaluation: ContractEvaluationResult
): ContractEvaluationSummaryView {
  return {
    allRulesPassed: evaluation.allRulesPassed,
    hasCriticalViolation: evaluation.hasCriticalViolation,
    criticalViolationCodes: evaluation.criticalViolations.map((rule) => rule.code),
    warningCodes: evaluation.warnings.map((rule) => rule.code),
    informationalCodes: evaluation.informational.map((rule) => rule.code)
  };
}

export function mapSessionAggregateResponse(
  aggregate: SessionAggregate
): SessionAggregateResponse {
  return {
    session: mapSessionView(aggregate.session),
    contract: mapContractSummaryView(aggregate.contract),
    checkpoints: aggregate.checkpoints.map(mapCheckpointView),
    artifacts: aggregate.artifacts.map(mapArtifactView),
    vivaAttempts: aggregate.vivaAttempts.map(mapVivaAttemptView),
    blocks: aggregate.blocks.map(mapSessionBlockView),
    penalties: aggregate.penalties.map(mapPenaltyView)
  };
}

export function mapSessionMutationResponse(session: Session): SessionMutationResponse {
  return {
    session: mapSessionView(session)
  };
}

export function mapSubmitArtifactResponse(artifact: Artifact): SubmitArtifactResponse {
  return {
    artifact: mapArtifactView(artifact)
  };
}

export function mapReviewResultResponse(result: {
  session: Session;
  scoring: ScoringResult;
  contractEvaluation: ContractEvaluationResult;
}): ReviewResultResponse {
  return {
    session: mapSessionView(result.session),
    scoring: mapScoringResultView(result.scoring),
    contractEvaluation: mapContractEvaluationSummaryView(result.contractEvaluation)
  };
}

export function mapGetSessionResponse(aggregate: SessionAggregate): GetSessionResponse {
  return mapSessionAggregateResponse(aggregate);
}

export function mapGetScoringResponse(
  scoring: ScoringResult | null
): GetScoringResponse {
  return {
    scoring: scoring ? mapScoringResultView(scoring) : null
  };
}

export function mapGetEventsResponse(
  events: readonly SessionEvent[]
): GetEventsResponse {
  return {
    events: events.map(mapSessionEventView)
  };
}

export function mapContractResponse(contract: Contract): ContractResponse {
  return {
    contract: mapContractSummaryView(contract)
  };
}

export function mapTelemetryIngestResponse(result: {
  telemetryEvent: { id: string };
  antiAvoidance: AntiAvoidanceResult | null;
}): IngestTelemetryResponse {
  return {
    telemetryEventId: result.telemetryEvent.id,
    antiAvoidance: result.antiAvoidance
      ? {
          patterns: result.antiAvoidance.patterns.map((pattern) => ({
            pattern: pattern.pattern,
            detected: pattern.detected,
            severity: pattern.severity,
            message: pattern.message,
            details: pattern.details
          })),
          overallSeverity: result.antiAvoidance.overallSeverity,
          hasEscalationSignal: result.antiAvoidance.hasEscalationSignal,
          recommendedResponses: [...result.antiAvoidance.recommendedResponses]
        }
      : null
  };
}
