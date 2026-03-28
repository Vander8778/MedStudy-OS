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

import { TelemetryProcessor } from "../telemetry.processor";

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
});
