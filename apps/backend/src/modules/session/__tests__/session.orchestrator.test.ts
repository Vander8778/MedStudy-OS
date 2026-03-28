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
  type AntiAvoidanceResult,
  evaluateContractRules,
  isOutcomeDecided,
  scoreSession,
  type Contract,
  type SessionBlock,
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
    blocks: [] as SessionBlock[],
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

  it("passes persisted pause-block totals into M4 contract evaluation", async () => {
    const aggregate = createAggregate("active_valid");
    aggregate.blocks = [
      {
        id: "block_pause_1",
        sessionId: "session_1",
        type: "pause",
        range: {
          startsAt: "2026-03-28T09:30:00.000Z",
          endsAt: "2026-03-28T09:42:00.000Z"
        },
        creditedMinutes: 0,
        createdAt: "2026-03-28T09:30:00.000Z",
        updatedAt: "2026-03-28T09:42:00.000Z"
      }
    ];
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

    vi.mocked(evaluateContractRules).mockImplementation(((input) => {
      expect(input.session.totalPauseMinutes).toBe(12);
      return {
        allRulesPassed: true,
        hasCriticalViolation: false,
        rules: [],
        criticalViolations: [],
        warnings: [],
        informational: []
      };
    }) as typeof evaluateContractRules);

    vi.mocked(scoreSession).mockReturnValue({
      ok: true,
      result: {
        outcome: "completed",
        sessionScore: 90,
        components: {
          validTime: { raw: 100, weight: 0.35, weighted: 35 },
          process: { raw: 90, weight: 0.2, weighted: 18 },
          artifact: { raw: 100, weight: 0.25, weighted: 25 },
          knowledge: { raw: 60, weight: 0.2, weighted: 12 }
        },
        hardFail: { triggered: false, reasons: [] },
        decisionTrace: { decidedByHardFail: false }
      }
    } as ReturnType<typeof scoreSession>);

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    await orchestrator.requestReview("session_1");

    expect(evaluateContractRules).toHaveBeenCalledTimes(1);
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

  it("uses M4 artifact-rule details as the single source of truth for mandatoryFinalArtifactMissing", async () => {
    const aggregate = createAggregate("active_valid");
    aggregate.artifacts = [];
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
      allRulesPassed: false,
      hasCriticalViolation: false,
      rules: [
        {
          code: "mandatory_artifacts_missing",
          passed: false,
          severity: "critical",
          message: "Mandatory artifacts required by the contract are missing.",
          details: {
            missingArtifactTypes: ["final_submission"],
            mandatoryFinalArtifactMissing: false
          }
        }
      ],
      criticalViolations: [],
      warnings: [],
      informational: []
    } as ReturnType<typeof evaluateContractRules>);

    vi.mocked(scoreSession).mockImplementation(((input) => {
      expect(input.hardFailSignals.mandatoryFinalArtifactMissing).toBe(false);
      expect(input.hardFailSignals.vivaScore).toBe(82);
      return {
        ok: true,
        result: {
          outcome: "failed",
          sessionScore: 40,
          components: {
            validTime: { raw: 100, weight: 0.35, weighted: 35 },
            process: { raw: 5, weight: 0.2, weighted: 1 },
            artifact: { raw: 0, weight: 0.25, weighted: 0 },
            knowledge: { raw: 20, weight: 0.2, weighted: 4 }
          },
          hardFail: { triggered: true, reasons: [] },
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

    await orchestrator.requestReview("session_1");

    expect(scoreSession).toHaveBeenCalledTimes(1);
  });

  it("guards early against duplicate review requests once an outcome is already decided", async () => {
    const aggregate = createAggregate("completed");
    expect(isOutcomeDecided(aggregate.session.state)).toBe(true);

    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(),
      saveSessionEvent: vi.fn(),
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

    await expect(orchestrator.requestReview("session_1")).rejects.toThrow(
      "already has a decided outcome"
    );
    expect(evaluateContractRules).not.toHaveBeenCalled();
    expect(scoreSession).not.toHaveBeenCalled();
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

  it("guards early against duplicate review requests while review is already pending", async () => {
    const aggregate = createAggregate("review_pending");
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(),
      saveSessionEvent: vi.fn(),
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

    await expect(orchestrator.requestReview("session_1")).rejects.toThrow(
      "already has a review in progress"
    );
    expect(evaluateContractRules).not.toHaveBeenCalled();
    expect(scoreSession).not.toHaveBeenCalled();
  });

  it("routes all avoidance follow-up actions through the orchestrator and notification boundary", async () => {
    const aggregate = createAggregate("active_valid");
    const assessment: AntiAvoidanceResult = {
      patterns: [],
      overallSeverity: "critical",
      hasEscalationSignal: true,
      recommendedResponses: ["raise_warning", "escalate_to_review", "flag_for_admin"]
    };
    const repository = {
      withTransaction: vi
        .fn()
        .mockImplementationOnce(async (callback) => callback({ tx: "warning" }))
        .mockImplementationOnce(async (callback) => callback({ tx: "review" })),
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
      saveAntiAvoidanceResult: vi.fn(async () => undefined)
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
      rules: [
        {
          code: "mandatory_artifacts_complete",
          passed: true,
          severity: "info",
          message: "All mandatory artifacts required by the contract are present.",
          details: {
            missingArtifactTypes: [],
            mandatoryFinalArtifactMissing: false
          }
        }
      ],
      criticalViolations: [],
      warnings: [],
      informational: []
    } as ReturnType<typeof evaluateContractRules>);

    vi.mocked(scoreSession).mockReturnValue({
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
        hardFail: { triggered: false, reasons: [] },
        decisionTrace: { decidedByHardFail: false }
      }
    } as ReturnType<typeof scoreSession>);

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    await orchestrator.processAvoidanceAssessment("session_1", assessment);

    expect(auditService.saveAntiAvoidanceResult).toHaveBeenCalledWith("session_1", assessment);
    expect(timerService.scheduleWarningGraceExpiry).toHaveBeenCalledWith(
      "session_1",
      5,
      expect.any(Function)
    );
    expect(notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "avoidance.flag_for_admin",
        userId: "user_1",
        sessionId: "session_1"
      })
    );
    expect(repository.withTransaction).toHaveBeenCalledTimes(2);
  });

  it("submits artifacts transactionally and derives isMandatory from contract terms", async () => {
    const aggregate = createAggregate("active_valid");
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(),
      saveSessionEvent: vi.fn(async () => undefined),
      createArtifact: vi.fn(async (artifact) => artifact),
      createSessionBundle: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(async () => undefined),
      saveScoringResult: vi.fn(async () => undefined),
      saveAntiAvoidanceResult: vi.fn(async () => undefined)
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

    await orchestrator.submitArtifact("session_1", {
      type: "final_submission",
      title: "Final artifact",
      source: "user_upload",
      status: "submitted",
      createdByUserId: "user_1"
    });

    expect(repository.withTransaction).toHaveBeenCalledTimes(1);
    expect(repository.createArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session_1",
        type: "final_submission",
        isMandatory: true,
        createdByUserId: "user_1"
      }),
      expect.anything()
    );
    expect(repository.saveSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session_1",
        type: "artifact_submitted",
        state: "active_valid",
        details: expect.objectContaining({
          artifactType: "final_submission",
          artifactStatus: "submitted"
        })
      }),
      expect.anything()
    );
  });

  it("creates checkpoints from the contract interval when creating a session", async () => {
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async (sessionId: string) => ({
        ...createAggregate("planned"),
        session: {
          ...createAggregate("planned").session,
          id: sessionId as Session["id"]
        }
      })),
      createSessionBundle: vi.fn(async (session, checkpoints, initialEvents) => ({
        session,
        checkpoints,
        initialEvents
      })),
      saveSession: vi.fn(),
      saveSessionEvent: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(async () => undefined),
      saveScoringResult: vi.fn(async () => undefined),
      saveAntiAvoidanceResult: vi.fn(async () => undefined)
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
    const contractService = {
      getContract: vi.fn(async () => ({
        ...createAggregate("planned").contract,
        terms: {
          ...createAggregate("planned").contract.terms,
          checkpointIntervalMinutes: 30
        }
      }))
    };

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    await orchestrator.createSession({
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "New session",
      objective: "Test checkpoint creation",
      plannedRange: {
        startsAt: "2026-03-28T09:00:00.000Z",
        endsAt: "2026-03-28T11:00:00.000Z"
      },
      finalArtifactRequired: true
    });

    expect(repository.createSessionBundle).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ order: 1, title: "Checkpoint 1" }),
        expect.objectContaining({ order: 2, title: "Checkpoint 2" }),
        expect.objectContaining({ order: 3, title: "Checkpoint 3" }),
        expect.objectContaining({ order: 4, title: "Checkpoint 4" })
      ]),
      [expect.objectContaining({ type: "planned" })]
    );
  });

  it("does not create checkpoints when the interval is missing or longer than the session", async () => {
    const repository = {
      withTransaction: vi.fn(async (callback) => callback({ tx: true })),
      findSessionAggregateOrThrow: vi.fn(async (sessionId: string) => ({
        ...createAggregate("planned"),
        session: {
          ...createAggregate("planned").session,
          id: sessionId as Session["id"]
        }
      })),
      createSessionBundle: vi.fn(async (session, checkpoints, initialEvents) => ({
        session,
        checkpoints,
        initialEvents
      })),
      saveSession: vi.fn(),
      saveSessionEvent: vi.fn(),
      listSessionEvents: vi.fn(),
      getLatestScoring: vi.fn()
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(async () => undefined),
      saveScoringResult: vi.fn(async () => undefined),
      saveAntiAvoidanceResult: vi.fn(async () => undefined)
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
    const contractService = {
      getContract: vi
        .fn()
        .mockResolvedValueOnce({
          ...createAggregate("planned").contract,
          terms: {
            ...createAggregate("planned").contract.terms,
            checkpointIntervalMinutes: undefined
          }
        })
        .mockResolvedValueOnce({
          ...createAggregate("planned").contract,
          terms: {
            ...createAggregate("planned").contract.terms,
            checkpointIntervalMinutes: 180
          }
        })
    };

    const orchestrator = new SessionOrchestrator(
      repository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );

    await orchestrator.createSession({
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "No checkpoints",
      objective: "Missing interval",
      plannedRange: {
        startsAt: "2026-03-28T09:00:00.000Z",
        endsAt: "2026-03-28T11:00:00.000Z"
      },
      finalArtifactRequired: true
    });

    await orchestrator.createSession({
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Long interval",
      objective: "Interval longer than session",
      plannedRange: {
        startsAt: "2026-03-28T09:00:00.000Z",
        endsAt: "2026-03-28T11:00:00.000Z"
      },
      finalArtifactRequired: true
    });

    expect(repository.createSessionBundle).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      [],
      [expect.objectContaining({ type: "planned" })]
    );
    expect(repository.createSessionBundle).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      [],
      [expect.objectContaining({ type: "planned" })]
    );
  });
});
