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
    }))
  };
});

import type { Session } from "@medstudy/domain";
import { TelemetryAnalysisScheduler } from "../telemetry-analysis.scheduler";
import { TelemetryAnalysisWorker } from "../telemetry-analysis.worker";

function createAggregate(state: Session["state"] = "active_warning") {
  return {
    session: {
      id: "session_1",
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "Telemetry pipeline test",
      objective: "Verify scheduler to worker flow",
      state,
      plannedRange: {
        startsAt: "2026-03-30T09:00:00.000Z",
        endsAt: "2026-03-30T11:00:00.000Z"
      },
      startedAt: "2026-03-30T09:00:00.000Z",
      validMinutes: 20,
      invalidMinutes: 5,
      warningCount: 1,
      missedCheckpointCount: 0,
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
        id: "event_warning",
        sessionId: "session_1",
        type: "warning_raised",
        actor: { actorType: "system", label: "avoidance.raise_warning" },
        state: "active_warning",
        occurredAt: "2026-03-30T09:10:00.000Z"
      }
    ]
  };
}

describe("Telemetry scheduler pipeline", () => {
  it("runs the scheduler -> worker -> orchestrator cycle and advances the checkpoint", async () => {
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
          occurredAt: "2026-03-30T09:15:00.000Z",
          receivedAt: "2026-03-30T09:15:01.000Z",
          serverReceivedAt: "2026-03-30T09:15:01.000Z",
          payload: {},
          createdAt: "2026-03-30T09:15:01.000Z"
        },
        {
          id: "telemetry_2",
          userId: "user_1",
          sessionId: "session_1",
          source: "desktop",
          type: "input_activity",
          occurredAt: "2026-03-30T09:16:00.000Z",
          receivedAt: "2026-03-30T09:16:01.000Z",
          serverReceivedAt: "2026-03-30T09:16:01.000Z",
          payload: { activityCount: 1 },
          createdAt: "2026-03-30T09:16:01.000Z"
        }
      ]),
      saveSummary: vi.fn(async (summary) => summary),
      advanceCheckpoint: vi.fn(async () => undefined),
      countPreviousSessionAvoidanceResults: vi.fn(async () => 0)
    };
    const sessionRepository = {
      findSessionAggregateOrThrow: vi.fn(async () => createAggregate()),
      listSessionIdsByStates: vi.fn(async () => [])
    };
    const orchestrator = {
      processAvoidanceAssessment: vi.fn(async () => undefined)
    };

    const worker = new TelemetryAnalysisWorker(
      telemetryRepository as never,
      sessionRepository as never,
      orchestrator as never
    );
    const scheduler = new TelemetryAnalysisScheduler(
      worker,
      sessionRepository as never
    );

    scheduler.registerSession("session_1", 0);
    await scheduler.tick(0);

    expect(sessionRepository.findSessionAggregateOrThrow).toHaveBeenCalledWith(
      "session_1"
    );
    expect(telemetryRepository.saveSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session_1",
        rawEventCount: 2
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
        lastProcessedRawEventId: "telemetry_2",
        lastAnalyzedAt: "2026-03-30T09:16:01.000Z"
      }
    );
    expect(scheduler.isRegistered("session_1")).toBe(true);
  });
});
