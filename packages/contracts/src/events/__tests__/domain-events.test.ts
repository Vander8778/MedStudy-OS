import { describe, expect, it } from "vitest";
import { domainEventSchema } from "../domain-events";

describe("domainEventSchema", () => {
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
