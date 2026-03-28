import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@medstudy/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@medstudy/domain")>();

  return {
    ...actual,
    evaluateContractRules: vi.fn(actual.evaluateContractRules),
    scoreSession: vi.fn(actual.scoreSession)
  };
});

import {
  evaluateContractRules,
  scoreSession,
  type Contract,
  type Session
} from "@medstudy/domain";
import { SessionOrchestrator } from "../session.orchestrator";

function createAggregate(state: Session["state"]) {
  const session: Session = {
    id: "session_1" as Session["id"],
    userId: "user_1" as Session["userId"],
    profileId: "profile_1" as Session["profileId"],
    contractId: "contract_1" as Session["contractId"],
    title: "Backend orchestration test",
    objective: "Verify orchestration flow",
    state,
    plannedRange: {
      startsAt: "2026-03-28T09:00:00.000Z" as Session["plannedRange"]["startsAt"],
      endsAt: "2026-03-28T11:00:00.000Z" as Session["plannedRange"]["endsAt"]
    },
    validMinutes: 90 as Session["validMinutes"],
    invalidMinutes: 0 as Session["invalidMinutes"],
    warningCount: 0,
    missedCheckpointCount: 0,
    finalArtifactRequired: true,
    blockIds: [],
    checkpointIds: ["checkpoint_1" as Session["checkpointIds"][number]],
    artifactIds: ["artifact_1" as Session["artifactIds"][number]],
    evaluationIds: [],
    vivaAttemptIds: ["viva_1" as Session["vivaAttemptIds"][number]],
    penaltyIds: [],
    createdAt: "2026-03-28T08:55:00.000Z" as Session["createdAt"],
    updatedAt: "2026-03-28T08:55:00.000Z" as Session["updatedAt"]
  };

  const contract: Contract = {
    id: "contract_1" as Contract["id"],
    userId: "user_1" as Contract["userId"],
    name: "Core contract",
    status: "active",
    terms: {
      minValidMinutes: 60 as Contract["terms"]["minValidMinutes"],
      maxMissedCheckpoints: 1,
      mandatoryArtifactTypes: ["final_submission"],
      vivaPassingScore: 70 as Contract["terms"]["vivaPassingScore"],
      checkpointIntervalMinutes: 30 as Contract["terms"]["checkpointIntervalMinutes"],
      maxPauseMinutes: 10 as Contract["terms"]["maxPauseMinutes"]
    },
    activeRange: {
      startsAt: "2026-03-28T09:00:00.000Z" as Contract["activeRange"]["startsAt"],
      endsAt: "2026-03-28T11:00:00.000Z" as Contract["activeRange"]["endsAt"]
    },
    tags: [],
    createdAt: "2026-03-28T08:00:00.000Z" as Contract["createdAt"],
    updatedAt: "2026-03-28T08:00:00.000Z" as Contract["updatedAt"]
  };

  return {
    session,
    contract,
    artifacts: [
      {
        id: "artifact_1",
        sessionId: "session_1",
        type: "final_submission",
        source: "user_upload",
        status: "submitted",
        title: "Final artifact",
        isMandatory: true,
        submittedAt: "2026-03-28T10:30:00.000Z",
        createdAt: "2026-03-28T10:30:00.000Z",
        updatedAt: "2026-03-28T10:30:00.000Z"
      }
    ],
    checkpoints: [
      {
        id: "checkpoint_1",
        sessionId: "session_1",
        order: 1,
        title: "Checkpoint 1",
        status: "completed",
        dueAt: "2026-03-28T09:30:00.000Z",
        completedAt: "2026-03-28T09:29:00.000Z",
        createdAt: "2026-03-28T08:55:00.000Z",
        updatedAt: "2026-03-28T09:29:00.000Z"
      }
    ],
    vivaAttempts: [
      {
        id: "viva_1",
        sessionId: "session_1",
        status: "passed",
        score: 82,
        passingScore: 70,
        createdAt: "2026-03-28T10:40:00.000Z",
        updatedAt: "2026-03-28T10:40:00.000Z"
      }
    ],
    penalties: [],
    events: []
  };
}

describe("SessionOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports the start flow planned -> arming -> armed -> active_valid", async () => {
    const aggregate = createAggregate("planned");
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({})),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(async (session) => {
        aggregate.session = session;
        return session;
      }),
      saveSessionEvent: vi.fn(async (event) => event),
      createSessionBundle: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(),
      saveScoringResult: vi.fn(),
      saveAntiAvoidanceResult: vi.fn()
    };
    const timerService = {
      scheduleCheckpointDueChecks: vi.fn(),
      scheduleSessionReview: vi.fn(),
      schedulePeriodicAvoidanceCheck: vi.fn(),
      schedulePauseLimitExpiry: vi.fn(),
      scheduleWarningGraceExpiry: vi.fn(),
      cancelPauseLimitExpiry: vi.fn(),
      cancelWarningGraceExpiry: vi.fn(),
      clearAllForSession: vi.fn()
    };
    const notificationService = { notify: vi.fn() };
    const contractService = { getContract: vi.fn() };

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    await orchestrator.armSession("session_1", { actorType: "user" });
    expect(aggregate.session.state).toBe("arming");

    aggregate.session.state = "arming";
    await orchestrator.confirmArmSession("session_1", { actorType: "user" });
    expect(aggregate.session.state).toBe("armed");

    aggregate.session.state = "armed";
    await orchestrator.startSession("session_1", { actorType: "user" });
    expect(aggregate.session.state).toBe("active_valid");
    expect(timerService.scheduleSessionReview).toHaveBeenCalled();
  });

  it("runs review flow in the order M4 -> M3 -> final M2 outcome transition inside a transaction", async () => {
    const aggregate = createAggregate("active_valid");
    const callOrder: string[] = [];
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(async (session) => {
        callOrder.push(`saveSession:${session.state}`);
        aggregate.session = session;
        return session;
      }),
      saveSessionEvent: vi.fn(async () => undefined),
      createSessionBundle: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(async () => {
        callOrder.push("saveContractEvaluation");
      }),
      saveScoringResult: vi.fn(async () => {
        callOrder.push("saveScoringResult");
      }),
      saveAntiAvoidanceResult: vi.fn()
    };
    const timerService = {
      scheduleCheckpointDueChecks: vi.fn(),
      scheduleSessionReview: vi.fn(),
      schedulePeriodicAvoidanceCheck: vi.fn(),
      schedulePauseLimitExpiry: vi.fn(),
      scheduleWarningGraceExpiry: vi.fn(),
      cancelPauseLimitExpiry: vi.fn(),
      cancelWarningGraceExpiry: vi.fn(),
      clearAllForSession: vi.fn()
    };
    const notificationService = { notify: vi.fn() };
    const contractService = { getContract: vi.fn() };

    vi.mocked(evaluateContractRules).mockImplementation(((input) => {
      callOrder.push("evaluateContractRules");
      return {
        allRulesPassed: false,
        hasCriticalViolation: true,
        rules: [],
        criticalViolations: [],
        warnings: [],
        informational: []
      };
    }) as typeof evaluateContractRules);

    vi.mocked(scoreSession).mockImplementation(((input) => {
      callOrder.push("scoreSession");
      expect(input.hardFailSignals.criticalContractViolation).toBe(true);
      return {
        ok: true,
        result: {
          outcome: "completed",
          sessionScore: 91,
          components: {
            validTime: { raw: 100, weight: 0.35, weighted: 35 },
            process: { raw: 90, weight: 0.2, weighted: 18 },
            artifact: { raw: 100, weight: 0.25, weighted: 25 },
            knowledge: { raw: 65, weight: 0.2, weighted: 13 }
          },
          hardFail: { triggered: true, reasons: ["critical_contract_violation"] },
          decisionTrace: { decidedByHardFail: true }
        }
      };
    }) as typeof scoreSession);

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    const result = await orchestrator.requestReview("session_1", {
      actor: { actorType: "user" }
    });

    expect(repository.withTransaction).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual([
      "saveSession:review_pending",
      "evaluateContractRules",
      "scoreSession",
      "saveSession:completed",
      "saveContractEvaluation",
      "saveScoringResult"
    ]);
    expect(timerService.clearAllForSession).toHaveBeenCalledWith("session_1");
    expect(result.session.state).toBe("completed");
  });

  it("maps a partial M3 outcome into the M2 partial outcome transition", async () => {
    const aggregate = createAggregate("active_valid");
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(async (session) => {
        aggregate.session = session;
        return session;
      }),
      saveSessionEvent: vi.fn(async () => undefined),
      createSessionBundle: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(async () => undefined),
      saveScoringResult: vi.fn(async () => undefined),
      saveAntiAvoidanceResult: vi.fn()
    };
    const timerService = {
      scheduleCheckpointDueChecks: vi.fn(),
      scheduleSessionReview: vi.fn(),
      schedulePeriodicAvoidanceCheck: vi.fn(),
      schedulePauseLimitExpiry: vi.fn(),
      scheduleWarningGraceExpiry: vi.fn(),
      cancelPauseLimitExpiry: vi.fn(),
      cancelWarningGraceExpiry: vi.fn(),
      clearAllForSession: vi.fn()
    };
    const notificationService = { notify: vi.fn() };
    const contractService = { getContract: vi.fn() };

    vi.mocked(evaluateContractRules).mockReturnValue({
      allRulesPassed: true,
      hasCriticalViolation: false,
      rules: [],
      criticalViolations: [],
      warnings: [],
      informational: []
    } as ReturnType<typeof evaluateContractRules>);

    vi.mocked(scoreSession).mockReturnValue({
      ok: true,
      result: {
        outcome: "partial",
        sessionScore: 70,
        components: {
          validTime: { raw: 70, weight: 0.35, weighted: 24.5 },
          process: { raw: 70, weight: 0.2, weighted: 14 },
          artifact: { raw: 70, weight: 0.25, weighted: 17.5 },
          knowledge: { raw: 70, weight: 0.2, weighted: 14 }
        },
        hardFail: { triggered: false, reasons: [] },
        decisionTrace: {
          decidedByHardFail: false,
          scoreThresholdApplied: { min: 65, max: 85, outcome: "partial" }
        }
      }
    } as ReturnType<typeof scoreSession>);

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    const result = await orchestrator.requestReview("session_1");

    expect(result.session.state).toBe("partial");
  });

  it("persists a penalty record inside the penalize flow transaction", async () => {
    const aggregate = createAggregate("failed");
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(async (session) => {
        aggregate.session = session;
        return session;
      }),
      saveSessionEvent: vi.fn(async () => undefined),
      createPenaltyRecord: vi.fn(async () => undefined),
      createSessionBundle: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(async () => undefined),
      saveScoringResult: vi.fn(async () => undefined),
      saveAntiAvoidanceResult: vi.fn()
    };
    const timerService = {
      scheduleCheckpointDueChecks: vi.fn(),
      scheduleSessionReview: vi.fn(),
      schedulePeriodicAvoidanceCheck: vi.fn(),
      schedulePauseLimitExpiry: vi.fn(),
      scheduleWarningGraceExpiry: vi.fn(),
      cancelPauseLimitExpiry: vi.fn(),
      cancelWarningGraceExpiry: vi.fn(),
      clearAllForSession: vi.fn()
    };
    const notificationService = { notify: vi.fn() };
    const contractService = { getContract: vi.fn() };

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    const result = await orchestrator.penalizeSession("session_1", { actorType: "admin" });

    expect(repository.withTransaction).toHaveBeenCalledTimes(1);
    expect(repository.createPenaltyRecord).toHaveBeenCalledTimes(1);
    expect(result.state).toBe("penalized");
    expect(repository.createPenaltyRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        contractId: "contract_1",
        sessionId: "session_1",
        type: "session_failure",
        reason: "contract_violation",
        status: "active"
      }),
      expect.anything()
    );
  });

  it("cancels warning and pause timers when a session leaves those timed states", async () => {
    const pausedAggregate = createAggregate("paused_valid");
    const pausedRepository = {
      withTransaction: vi.fn(async (callback) => callback({})),
      findSessionAggregateOrThrow: vi.fn(async () => pausedAggregate),
      saveSession: vi.fn(async (session) => {
        pausedAggregate.session = session;
        return session;
      }),
      saveSessionEvent: vi.fn(async () => undefined),
      createSessionBundle: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const warningAggregate = createAggregate("active_warning");
    const warningRepository = {
      withTransaction: vi.fn(async (callback) => callback({})),
      findSessionAggregateOrThrow: vi.fn(async () => warningAggregate),
      saveSession: vi.fn(async (session) => {
        warningAggregate.session = session;
        return session;
      }),
      saveSessionEvent: vi.fn(async () => undefined),
      createSessionBundle: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(),
      saveScoringResult: vi.fn(),
      saveAntiAvoidanceResult: vi.fn()
    };
    const timerService = {
      scheduleCheckpointDueChecks: vi.fn(),
      scheduleSessionReview: vi.fn(),
      schedulePeriodicAvoidanceCheck: vi.fn(),
      schedulePauseLimitExpiry: vi.fn(),
      scheduleWarningGraceExpiry: vi.fn(),
      cancelPauseLimitExpiry: vi.fn(),
      cancelWarningGraceExpiry: vi.fn(),
      clearAllForSession: vi.fn()
    };
    const notificationService = { notify: vi.fn() };
    const contractService = { getContract: vi.fn() };

    const pausedOrchestrator = new SessionOrchestrator(
      pausedRepository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );
    await pausedOrchestrator.resumeSession("session_1", "pause_within_limit", {
      actorType: "user"
    });

    const warningOrchestrator = new SessionOrchestrator(
      warningRepository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );
    await warningOrchestrator.resumeSession("session_1", "warning_resolved", {
      actorType: "user"
    });

    expect(timerService.cancelPauseLimitExpiry).toHaveBeenCalledWith("session_1");
    expect(timerService.cancelWarningGraceExpiry).toHaveBeenCalledWith("session_1");
  });
});
