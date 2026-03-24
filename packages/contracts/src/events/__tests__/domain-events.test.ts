import { describe, expect, it } from "vitest";
import { domainEventSchema } from "../domain-events";

describe("domainEventSchema", () => {
  it("accepts a session.started event", () => {
    const parsed = domainEventSchema.parse({
      id: "event_session_started",
      type: "session.started",
      occurredAt: "2026-03-23T09:00:00+03:00",
      sessionId: "session_1",
      userId: "user_1"
    });

    expect(parsed.type).toBe("session.started");
  });

  it("accepts a known event variant", () => {
    const parsed = domainEventSchema.parse({
      id: "event_1",
      type: "checkpoint.missed",
      occurredAt: "2026-03-23T10:00:00+03:00",
      sessionId: "session_1",
      userId: "user_1",
      checkpointId: "checkpoint_1"
    });

    expect(parsed.type).toBe("checkpoint.missed");
  });

  it("accepts an evaluation.completed event", () => {
    const parsed = domainEventSchema.parse({
      id: "event_evaluation_completed",
      type: "evaluation.completed",
      occurredAt: "2026-03-23T10:30:00+03:00",
      sessionId: "session_1",
      userId: "user_1",
      evaluationId: "evaluation_1",
      score: 82
    });

    expect(parsed.type).toBe("evaluation.completed");
  });

  it("accepts a penalty.issued event", () => {
    const parsed = domainEventSchema.parse({
      id: "event_penalty_issued",
      type: "penalty.issued",
      occurredAt: "2026-03-23T11:00:00+03:00",
      userId: "user_1",
      penaltyId: "penalty_1"
    });

    expect(parsed.type).toBe("penalty.issued");
  });

  it("rejects invalid event payloads for a discriminated variant", () => {
    const result = domainEventSchema.safeParse({
      id: "event_1",
      type: "artifact.submitted",
      occurredAt: "2026-03-23T10:00:00+03:00",
      sessionId: "session_1",
      userId: "user_1"
    });

    expect(result.success).toBe(false);
  });
});
