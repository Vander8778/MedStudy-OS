import type {
  AntiAvoidanceResult,
  Artifact,
  Checkpoint,
  ContractEvaluationResult,
  Penalty,
  ScoringResult,
  Session,
  SessionEvent
} from "@medstudy/domain";
import { SessionOrchestrator } from "../modules/session/session.orchestrator";
import type { SessionAggregate } from "../modules/session/session.repository";
import type {
  CreateTelemetryEventCommand,
  TelemetryAnalysisCheckpointRecord,
  TelemetryEventRecord,
  TelemetrySummaryRecord
} from "../modules/telemetry/telemetry.repository";
import { TelemetryAnalysisScheduler } from "../modules/telemetry/telemetry-analysis.scheduler";
import { TelemetryAnalysisWorker } from "../modules/telemetry/telemetry-analysis.worker";
import { TelemetryProcessor } from "../modules/telemetry/telemetry.processor";
import { buildSessionAggregate } from "../__fixtures__/session.factory";
import { vi } from "vitest";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type MutableIntegrationState = {
  aggregate: SessionAggregate;
  scoring: ScoringResult | null;
  contractEvaluation: ContractEvaluationResult | null;
  antiAvoidanceResults: AntiAvoidanceResult[];
  domainEvents: unknown[];
  notifications: {
    channel: "in_app";
    type: string;
    userId: string;
    sessionId?: string;
    message: string;
  }[];
};

export function createSessionIntegrationHarness(
  aggregate: SessionAggregate = buildSessionAggregate()
) {
  const state: MutableIntegrationState = {
    aggregate: clone(aggregate),
    scoring: null,
    contractEvaluation: null,
    antiAvoidanceResults: [],
    domainEvents: [],
    notifications: []
  };

  const sessionRepository = {
    withTransaction: vi.fn(async <T>(callback: (db: never) => Promise<T>) =>
      callback({} as never)
    ),
    ensureUserProfileExists: vi.fn(async () => undefined),
    createSessionBundle: vi.fn(
      async (
        session: Session,
        checkpoints: readonly Checkpoint[],
        initialEvents: readonly SessionEvent[]
      ) => {
        state.aggregate = {
          ...state.aggregate,
          session: clone(session),
          checkpoints: clone(checkpoints),
          events: clone(initialEvents)
        };
        return session;
      }
    ),
    saveSession: vi.fn(async (session: Session) => {
      state.aggregate = {
        ...state.aggregate,
        session: clone(session)
      };
      return session;
    }),
    saveSessionEvent: vi.fn(async (event: SessionEvent) => {
      state.aggregate = {
        ...state.aggregate,
        events: [...state.aggregate.events, clone(event)]
      };
      return event;
    }),
    createArtifact: vi.fn(async (artifact: Artifact) => {
      state.aggregate = {
        ...state.aggregate,
        artifacts: [...state.aggregate.artifacts, clone(artifact)]
      };
      return artifact;
    }),
    createPenaltyRecord: vi.fn(async (penalty: Penalty) => {
      state.aggregate = {
        ...state.aggregate,
        penalties: [...state.aggregate.penalties, clone(penalty)]
      };
      return penalty;
    }),
    getLatestScoring: vi.fn(async () => (state.scoring ? clone(state.scoring) : null)),
    listSessionEvents: vi.fn(async () => clone(state.aggregate.events)),
    listSessionIdsByStates: vi.fn(async (states: readonly Session["state"][]) =>
      states.includes(state.aggregate.session.state) ? [state.aggregate.session.id] : []
    ),
    findSessionAggregateOrThrow: vi.fn(async () => clone(state.aggregate))
  };

  const auditService = {
    saveDomainEvents: vi.fn(async (events: readonly unknown[]) => {
      state.domainEvents.push(...clone(events));
      return undefined;
    }),
    saveScoringResult: vi.fn(async (_sessionId: string, result: ScoringResult) => {
      state.scoring = clone(result);
      return undefined;
    }),
    saveContractEvaluation: vi.fn(
      async (_sessionId: string, result: ContractEvaluationResult) => {
        state.contractEvaluation = clone(result);
        return undefined;
      }
    ),
    saveAntiAvoidanceResult: vi.fn(async (_sessionId: string, result: AntiAvoidanceResult) => {
      state.antiAvoidanceResults.push(clone(result));
      return undefined;
    })
  };

  const timerService = {
    scheduleCheckpointDueChecks: vi.fn(),
    scheduleSessionReview: vi.fn(),
    schedulePeriodicAvoidanceCheck: vi.fn(),
    schedulePauseLimitExpiry: vi.fn(),
    scheduleWarningGraceExpiry: vi.fn(),
    cancelWarningGraceExpiry: vi.fn(),
    cancelPauseLimitExpiry: vi.fn(),
    clearAllForSession: vi.fn()
  };

  const notificationService = {
    notify: vi.fn(
      (dispatch: {
        channel: "in_app";
        type: string;
        userId: string;
        sessionId?: string;
        message: string;
      }) => {
        state.notifications.push(clone(dispatch));
        return dispatch;
      }
    )
  };

  const contractService = {
    getContract: vi.fn(async () => clone(state.aggregate.contract))
  };

  const orchestrator = new SessionOrchestrator(
    sessionRepository as never,
    auditService as never,
    timerService as never,
    notificationService as never,
    contractService as never
  );

  return {
    state,
    sessionRepository,
    auditService,
    timerService,
    notificationService,
    contractService,
    orchestrator,
    getAggregate: () => clone(state.aggregate)
  };
}

export function createTelemetryIntegrationHarness(input?: {
  aggregate?: SessionAggregate;
  rawEvents?: readonly TelemetryEventRecord[];
  previousAvoidanceCount?: number;
}) {
  const sessionHarness = createSessionIntegrationHarness(
    input?.aggregate ?? buildSessionAggregate()
  );
  const telemetryState = {
    checkpoint: {
      id: "telemetry_checkpoint_fixture",
      sessionId: sessionHarness.state.aggregate.session.id,
      createdAt: "2026-04-07T09:00:00.000Z",
      updatedAt: "2026-04-07T09:00:00.000Z"
    } as TelemetryAnalysisCheckpointRecord,
    rawEvents: [...(input?.rawEvents ?? [])].map((event) => clone(event)),
    summaries: [] as TelemetrySummaryRecord[],
    previousAvoidanceCount: input?.previousAvoidanceCount ?? 0
  };

  const telemetryRepository = {
    createEvent: vi.fn(async (command: CreateTelemetryEventCommand) => {
      const duplicate =
        Boolean(command.sessionId) &&
        Boolean(command.clientEventId) &&
        telemetryState.rawEvents.some(
          (event) =>
            event.sessionId === command.sessionId &&
            event.clientEventId === command.clientEventId
        );
      const event: TelemetryEventRecord = duplicate
        ? clone(
            telemetryState.rawEvents.find(
              (existing) =>
                existing.sessionId === command.sessionId &&
                existing.clientEventId === command.clientEventId
            )!
          )
        : {
            id: `telemetry_${telemetryState.rawEvents.length + 1}`,
            userId: command.userId,
            sessionId: command.sessionId,
            clientEventId: command.clientEventId,
            source: command.source,
            type: command.type,
            occurredAt: command.occurredAt,
            receivedAt: command.receivedAt,
            serverReceivedAt: command.serverReceivedAt,
            payload: clone(command.payload),
            createdAt: command.serverReceivedAt
          };

      if (!duplicate) {
        telemetryState.rawEvents.push(clone(event));
      }

      return { event, duplicate };
    }),
    getOrCreateCheckpoint: vi.fn(async () => clone(telemetryState.checkpoint)),
    findEventsSinceCheckpoint: vi.fn(async () => clone(telemetryState.rawEvents)),
    saveSummary: vi.fn(async (summary: TelemetrySummaryRecord) => {
      telemetryState.summaries.push(clone(summary));
      return summary;
    }),
    advanceCheckpoint: vi.fn(
      async (
        _sessionId: string,
        update: {
          lastProcessedRawEventId: string;
          lastAnalyzedAt: string;
        }
      ) => {
        telemetryState.checkpoint = {
          ...telemetryState.checkpoint,
          lastProcessedRawEventId: update.lastProcessedRawEventId,
          lastAnalyzedAt: update.lastAnalyzedAt,
          updatedAt: update.lastAnalyzedAt
        };
        return clone(telemetryState.checkpoint);
      }
    ),
    countPreviousSessionAvoidanceResults: vi.fn(async () => telemetryState.previousAvoidanceCount)
  };

  const worker = new TelemetryAnalysisWorker(
    telemetryRepository as never,
    sessionHarness.sessionRepository as never,
    sessionHarness.orchestrator as never
  );
  const scheduler = new TelemetryAnalysisScheduler(
    worker,
    sessionHarness.sessionRepository as never
  );
  const processor = new TelemetryProcessor(telemetryRepository as never, scheduler as never);

  return {
    ...sessionHarness,
    telemetryRepository,
    telemetryState,
    worker,
    scheduler,
    processor
  };
}
