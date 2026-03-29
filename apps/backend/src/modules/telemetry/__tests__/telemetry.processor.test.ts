import { describe, expect, it, vi } from "vitest";

vi.mock("@medstudy/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@medstudy/domain")>();

  return {
    ...actual,
    analyzeAvoidance: vi.fn(() => ({
      patterns: [],
      overallSeverity: "high",
      hasEscalationSignal: true,
      recommendedResponses: ["raise_warning"]
    })),
    evaluateContractRules: vi.fn(actual.evaluateContractRules),
    scoreSession: vi.fn(actual.scoreSession)
  };
});

import {
  analyzeAvoidance,
  evaluateContractRules,
  scoreSession,
  type Contract,
  type Session,
  type SessionBlock
} from "@medstudy/domain";
import { SessionOrchestrator } from "../../session/session.orchestrator";
import { TelemetryProcessor } from "../telemetry.processor";

function createAggregate(state: Session["state"]) {
  const session: Session = {
    id: "session_1" as Session["id"],
    userId: "user_1" as Session["userId"],
    profileId: "profile_1" as Session["profileId"],
    contractId: "contract_1" as Session["contractId"],
    title: "Telemetry orchestration test",
    objective: "Verify telemetry chain",
    state,
    plannedRange: {
      startsAt: "2026-03-28T09:00:00.000Z" as Session["plannedRange"]["startsAt"],
      endsAt: "2026-03-28T11:00:00.000Z" as Session["plannedRange"]["endsAt"]
    },
    startedAt: "2026-03-28T09:00:00.000Z" as Session["startedAt"],
    validMinutes: 30 as Session["validMinutes"],
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

describe("TelemetryProcessor", () => {
  it("routes M5 escalation results back through the SessionOrchestrator instead of mutating session state directly", async () => {
    const telemetryRepository = {
      create: vi.fn(async (command) => ({ id: "telemetry_1", ...command }))
    };
    const sessionRepository = {
      findSessionAggregateOrThrow: vi.fn(async () => ({
        session: {
          id: "session_1",
          state: "active_valid",
          plannedRange: {
            startsAt: "2026-03-28T09:00:00.000Z",
            endsAt: "2026-03-28T11:00:00.000Z"
          },
          createdAt: "2026-03-28T08:55:00.000Z",
          validMinutes: 10,
          invalidMinutes: 0,
          warningCount: 0,
          missedCheckpointCount: 0
        }
      }))
    };
    const sessionOrchestrator = {
      processAvoidanceAssessment: vi.fn(async () => undefined)
    };

    const processor = new TelemetryProcessor(
      telemetryRepository as never,
      sessionRepository as never,
      sessionOrchestrator as never
    );

    await processor.ingestEvent({
      userId: "user_1",
      sessionId: "session_1",
      source: "desktop",
      type: "heartbeat",
      occurredAt: "2026-03-28T09:10:00.000Z",
      receivedAt: "2026-03-28T09:10:05.000Z",
      payload: {
        contextSwitchCount: 10
      }
    });

    expect(telemetryRepository.create).toHaveBeenCalledTimes(1);
    expect(sessionOrchestrator.processAvoidanceAssessment).toHaveBeenCalledTimes(1);
  });

  it("can drive the full telemetry -> avoidance -> warning -> review -> scoring -> outcome chain", async () => {
    const aggregate = createAggregate("active_valid");
    const telemetryRepository = {
      create: vi.fn(async (command) => ({ id: "telemetry_1", ...command }))
    };
    const sessionRepository = {
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

    vi.mocked(analyzeAvoidance).mockReturnValue({
      patterns: [],
      overallSeverity: "high",
      hasEscalationSignal: true,
      recommendedResponses: ["raise_warning", "escalate_to_review"]
    });
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
      sessionRepository as never,
      auditService as never,
      timerService as never,
      notificationService as never,
      contractService as never
    );
    const processor = new TelemetryProcessor(
      telemetryRepository as never,
      sessionRepository as never,
      orchestrator
    );

    const result = await processor.ingestEvent({
      userId: "user_1",
      sessionId: "session_1",
      source: "desktop",
      type: "heartbeat",
      occurredAt: "2026-03-28T09:10:00.000Z",
      receivedAt: "2026-03-28T09:10:05.000Z",
      payload: {
        contextSwitchCount: 10
      }
    });

    expect(result.antiAvoidance?.recommendedResponses).toEqual([
      "raise_warning",
      "escalate_to_review"
    ]);
    expect(auditService.saveAntiAvoidanceResult).toHaveBeenCalledWith(
      "session_1",
      expect.objectContaining({
        recommendedResponses: ["raise_warning", "escalate_to_review"]
      })
    );
    expect(timerService.scheduleWarningGraceExpiry).toHaveBeenCalledWith(
      "session_1",
      5,
      expect.any(Function)
    );
    expect(sessionRepository.withTransaction).toHaveBeenCalledTimes(2);
    expect(sessionRepository.saveSession).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ state: "active_warning" }),
      expect.anything()
    );
    expect(sessionRepository.saveSession).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ state: "review_pending" }),
      expect.anything()
    );
    expect(sessionRepository.saveSession).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ state: "completed" }),
      expect.anything()
    );
    expect(timerService.clearAllForSession).toHaveBeenCalledWith("session_1");
    expect(aggregate.session.state).toBe("completed");
  });
});
