import { describe, expect, it, vi } from "vitest";

vi.mock("@medstudy/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@medstudy/domain")>();

  return {
    ...actual,
    analyzeAvoidance: vi.fn(() => ({
      patterns: [],
      overallSeverity: "none",
      hasEscalationSignal: false,
      recommendedResponses: ["no_action"]
    }))
  };
});

import { analyzeAvoidance, type Session } from "@medstudy/domain";
import { TelemetryAnalysisWorker } from "../telemetry-analysis.worker";

function createAggregate(state: Session["state"] = "active_valid") {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Telemetry worker test",
      objective: "Verify worker pipeline",
      state,
      plannedRange: {
        startsAt: "2026-03-30T09:00:00.000Z",
        endsAt: "2026-03-30T11:00:00.000Z"
      },
      startedAt: "2026-03-30T09:00:00.000Z",
      validMinutes: 30,
      invalidMinutes: 5,
      warningCount: 1,
      missedCheckpointCount: 2,
      finalArtifactRequired: true,
      blockIds: [],
      checkpointIds: [],
      artifactIds: [],
      evaluationIds: [],
      vivaAttemptIds: [],
      penaltyIds: [],
      createdAt: "2026-03-30T08:55:00.000Z",
      updatedAt: "2026-03-30T09:20:00.000Z"
    },
    contract: {
      id: "contract_1",
      userId: "user_1",
      name: "Core contract",
      status: "active",
      terms: {
        minValidMinutes: 60,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70
      },
      activeRange: {
        startsAt: "2026-03-30T09:00:00.000Z",
        endsAt: "2026-03-30T11:00:00.000Z"
      },
      tags: [],
      createdAt: "2026-03-30T08:00:00.000Z",
      updatedAt: "2026-03-30T08:00:00.000Z"
    },
    blocks: [],
    artifacts: [],
    checkpoints: [],
    vivaAttempts: [],
    penalties: [],
    events: [
      {
        id: "event_arming",
        sessionId: "session_1",
        type: "arming_started",
        actor: { actorType: "user", userId: "user_1" },
        state: "arming",
        occurredAt: "2026-03-30T08:59:00.000Z"
      },
      {
        id: "event_cancel",
        sessionId: "session_1",
        type: "cancel",
        actor: { actorType: "user", userId: "user_1" },
        state: "planned",
        occurredAt: "2026-03-30T08:59:30.000Z"
      },
      {
        id: "event_warning",
        sessionId: "session_1",
        type: "warning_raised",
        actor: { actorType: "system", label: "avoidance.raise_warning" },
        state: "active_warning",
        occurredAt: "2026-03-30T09:10:00.000Z"
      },
      {
        id: "event_resume",
        sessionId: "session_1",
        type: "resumed",
        actor: { actorType: "system" },
        state: "active_valid",
        occurredAt: "2026-03-30T09:12:00.000Z",
        details: { reason: "warning_resolved" }
      },
      {
        id: "event_review",
        sessionId: "session_1",
        type: "review_requested",
        actor: { actorType: "system", label: "avoidance.escalate_to_review" },
        state: "review_pending",
        occurredAt: "2026-03-30T09:15:00.000Z"
      }
    ]
  };
}

describe("TelemetryAnalysisWorker", () => {
  it("skips direct re-entry for the same session as a worker-level safety guard", async () => {
    let release: (() => void) | undefined;
    const telemetryRepository = {
      getOrCreateCheckpoint: vi.fn(
        () =>
          new Promise((resolve) => {
            release = () =>
              resolve({
                id: "checkpoint_1",
                sessionId: "session_1",
                createdAt: "2026-03-30T09:00:00.000Z",
                updatedAt: "2026-03-30T09:00:00.000Z"
              });
          })
      ),
      findEventsSinceCheckpoint: vi.fn(async () => []),
      saveSummary: vi.fn(),
      advanceCheckpoint: vi.fn(),
      countPreviousSessionAvoidanceResults: vi.fn()
    };
    const sessionRepository = {
      findSessionAggregateOrThrow: vi.fn(async () => createAggregate("active_valid"))
    };
    const orchestrator = {
      processAvoidanceAssessment: vi.fn()
    };
    const worker = new TelemetryAnalysisWorker(
      telemetryRepository as never,
      sessionRepository as never,
      orchestrator as never
    );

    const firstRun = worker.processSessionAnalysis("session_1");
    const secondRun = worker.processSessionAnalysis("session_1");

    await expect(secondRun).resolves.toEqual({
      status: "skipped",
      deregister: false,
      reason: "already_running"
    });

    release?.();
    await firstRun;
  });

  it("skips terminal and non-active sessions", async () => {
    const telemetryRepository = {
      getOrCreateCheckpoint: vi.fn(),
      findEventsSinceCheckpoint: vi.fn(),
      saveSummary: vi.fn(),
      advanceCheckpoint: vi.fn(),
      countPreviousSessionAvoidanceResults: vi.fn()
    };
    const sessionRepository = {
      findSessionAggregateOrThrow: vi
        .fn()
        .mockResolvedValueOnce(createAggregate("completed"))
        .mockResolvedValueOnce(createAggregate("paused_valid"))
    };
    const orchestrator = {
      processAvoidanceAssessment: vi.fn()
    };
    const worker = new TelemetryAnalysisWorker(
      telemetryRepository as never,
      sessionRepository as never,
      orchestrator as never
    );

    await expect(worker.processSessionAnalysis("session_terminal")).resolves.toEqual({
      status: "skipped",
      deregister: true,
      reason: "terminal_state"
    });
    await expect(worker.processSessionAnalysis("session_paused")).resolves.toEqual({
      status: "skipped",
      deregister: true,
      reason: "non_active_state"
    });
    expect(telemetryRepository.getOrCreateCheckpoint).not.toHaveBeenCalled();
  });

  it("builds a summary, derives history from server-side data, and routes actionable M5 results through the orchestrator", async () => {
    const telemetryRepository = {
      getOrCreateCheckpoint: vi.fn(async () => ({
        id: "checkpoint_1",
        sessionId: "session_1",
        createdAt: "2026-03-30T09:00:00.000Z",
        updatedAt: "2026-03-30T09:00:00.000Z"
      })),
      findEventsSinceCheckpoint: vi.fn(async () => [
        {
          id: "telemetry_1",
          userId: "user_1",
          sessionId: "session_1",
          source: "desktop",
          type: "heartbeat",
          occurredAt: "2026-03-30T09:16:00.000Z",
          receivedAt: "2026-03-30T09:16:01.000Z",
          serverReceivedAt: "2026-03-30T09:16:01.000Z",
          payload: {},
          createdAt: "2026-03-30T09:16:01.000Z"
        },
        {
          id: "telemetry_2",
          userId: "user_1",
          sessionId: "session_1",
          source: "desktop",
          type: "window_changed",
          occurredAt: "2026-03-30T09:18:00.000Z",
          receivedAt: "2026-03-30T09:18:01.000Z",
          serverReceivedAt: "2026-03-30T09:18:01.000Z",
          payload: { isStudyContext: false, durationMinutes: 2 },
          createdAt: "2026-03-30T09:18:01.000Z"
        },
        {
          id: "telemetry_3",
          userId: "user_1",
          sessionId: "session_1",
          source: "desktop",
          type: "input_activity",
          occurredAt: "2026-03-30T09:19:00.000Z",
          receivedAt: "2026-03-30T09:19:01.000Z",
          serverReceivedAt: "2026-03-30T09:19:01.000Z",
          payload: { activityCount: 1 },
          createdAt: "2026-03-30T09:19:01.000Z"
        }
      ]),
      saveSummary: vi.fn(async (summary) => summary),
      advanceCheckpoint: vi.fn(async () => undefined),
      countPreviousSessionAvoidanceResults: vi.fn(async () => 7)
    };
    const sessionRepository = {
      findSessionAggregateOrThrow: vi.fn(async () => createAggregate("active_warning"))
    };
    const orchestrator = {
      processAvoidanceAssessment: vi.fn(async () => undefined)
    };

    vi.mocked(analyzeAvoidance).mockImplementation((input) => {
      expect(input.history).toEqual({
        warningRecoveryCount: 1,
        warningEscalationCount: 1,
        armingAttemptCount: 1,
        armingCancelCount: 1,
        previousSessionAvoidanceCount: 7
      });
      expect(input.behavior.contextSwitchCount).toBe(1);
      expect(input.behavior.nonStudyContextMinutes).toBe(2);
      expect(input.session.currentWarningActive).toBe(true);
      expect(input.session.currentWarningDurationMinutes).toBeGreaterThan(0);

      return {
        patterns: [],
        overallSeverity: "high",
        hasEscalationSignal: true,
        recommendedResponses: ["raise_warning"]
      };
    });

    const worker = new TelemetryAnalysisWorker(
      telemetryRepository as never,
      sessionRepository as never,
      orchestrator as never
    );

    const result = await worker.processSessionAnalysis("session_1");

    expect(result.status).toBe("processed");
    expect(telemetryRepository.saveSummary).toHaveBeenCalledTimes(1);
    expect(telemetryRepository.saveSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session_1",
        rawEventCount: 3
      })
    );
    expect(orchestrator.processAvoidanceAssessment).toHaveBeenCalledWith(
      "session_1",
      expect.objectContaining({
        recommendedResponses: ["raise_warning"]
      })
    );
    expect(telemetryRepository.advanceCheckpoint).toHaveBeenCalledWith(
      "session_1",
      {
        lastProcessedRawEventId: "telemetry_3",
        lastAnalyzedAt: "2026-03-30T09:19:01.000Z"
      }
    );
  });

  it("does not advance the checkpoint when actionable routing fails", async () => {
    const telemetryRepository = {
      getOrCreateCheckpoint: vi.fn(async () => ({
        id: "checkpoint_1",
        sessionId: "session_1",
        createdAt: "2026-03-30T09:00:00.000Z",
        updatedAt: "2026-03-30T09:00:00.000Z"
      })),
      findEventsSinceCheckpoint: vi.fn(async () => [
        {
          id: "telemetry_1",
          userId: "user_1",
          sessionId: "session_1",
          source: "desktop",
          type: "heartbeat",
          occurredAt: "2026-03-30T09:16:00.000Z",
          receivedAt: "2026-03-30T09:16:01.000Z",
          serverReceivedAt: "2026-03-30T09:16:01.000Z",
          payload: {},
          createdAt: "2026-03-30T09:16:01.000Z"
        }
      ]),
      saveSummary: vi.fn(async (summary) => summary),
      advanceCheckpoint: vi.fn(async () => undefined),
      countPreviousSessionAvoidanceResults: vi.fn(async () => 0)
    };
    const sessionRepository = {
      findSessionAggregateOrThrow: vi.fn(async () => createAggregate("active_valid"))
    };
    const orchestrator = {
      processAvoidanceAssessment: vi.fn(async () => {
        throw new Error("routing failed");
      })
    };

    vi.mocked(analyzeAvoidance).mockReturnValue({
      patterns: [],
      overallSeverity: "high",
      hasEscalationSignal: true,
      recommendedResponses: ["flag_for_admin"]
    });

    const worker = new TelemetryAnalysisWorker(
      telemetryRepository as never,
      sessionRepository as never,
      orchestrator as never
    );

    await expect(worker.processSessionAnalysis("session_1")).rejects.toThrow(
      "routing failed"
    );
    expect(telemetryRepository.advanceCheckpoint).not.toHaveBeenCalled();
  });

  it("no-ops when there are no new raw events since the checkpoint", async () => {
    const telemetryRepository = {
      getOrCreateCheckpoint: vi.fn(async () => ({
        id: "checkpoint_1",
        sessionId: "session_1",
        createdAt: "2026-03-30T09:00:00.000Z",
        updatedAt: "2026-03-30T09:00:00.000Z"
      })),
      findEventsSinceCheckpoint: vi.fn(async () => []),
      saveSummary: vi.fn(),
      advanceCheckpoint: vi.fn(),
      countPreviousSessionAvoidanceResults: vi.fn()
    };
    const sessionRepository = {
      findSessionAggregateOrThrow: vi.fn(async () => createAggregate("active_valid"))
    };
    const orchestrator = {
      processAvoidanceAssessment: vi.fn()
    };
    const worker = new TelemetryAnalysisWorker(
      telemetryRepository as never,
      sessionRepository as never,
      orchestrator as never
    );

    await expect(worker.processSessionAnalysis("session_1")).resolves.toEqual({
      status: "no_new_events",
      deregister: false
    });
    expect(telemetryRepository.saveSummary).not.toHaveBeenCalled();
    expect(orchestrator.processAvoidanceAssessment).not.toHaveBeenCalled();
  });
});
