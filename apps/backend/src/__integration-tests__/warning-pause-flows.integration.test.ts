import { describe, expect, it } from "vitest";
import { createSessionIntegrationHarness } from "./helpers";
import { buildSessionAggregate } from "../__fixtures__/session.factory";

describe("warning and pause flows integration", () => {
  it("returns from warning to active_valid when the warning is resolved in grace", async () => {
    const harness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "active_valid",
          startedAt: "2026-04-07T09:00:00.000Z"
        }
      })
    );

    const warning = await harness.orchestrator.dispatchSessionMutation(
      harness.state.aggregate.session.id,
      {
        id: "event_warning",
        type: "warning_raised",
        occurredAt: "2026-04-07T09:20:00.000Z",
        actorType: "system"
      }
    );
    const resumed = await harness.orchestrator.resumeSession(
      harness.state.aggregate.session.id,
      "warning_resolved"
    );

    expect(warning.state).toBe("active_warning");
    expect(resumed.state).toBe("active_valid");
    expect(harness.timerService.cancelWarningGraceExpiry).toHaveBeenCalledWith(
      harness.state.aggregate.session.id
    );
  });

  it("supports pause recovery and pause expiry through the real machine transitions", async () => {
    const harness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "active_valid",
          startedAt: "2026-04-07T09:00:00.000Z"
        }
      })
    );

    const paused = await harness.orchestrator.pauseSession(
      harness.state.aggregate.session.id
    );
    const resumed = await harness.orchestrator.resumeSession(
      harness.state.aggregate.session.id,
      "pause_within_limit"
    );
    const pausedAgain = await harness.orchestrator.pauseSession(
      harness.state.aggregate.session.id
    );
    const expired = await harness.orchestrator.dispatchSessionMutation(
      harness.state.aggregate.session.id,
      {
        id: "event_pause_timeout",
        type: "timeout",
        occurredAt: "2026-04-07T09:40:00.000Z",
        actorType: "system",
        reason: "pause_limit_exceeded"
      }
    );

    expect(paused.state).toBe("paused_valid");
    expect(resumed.state).toBe("active_valid");
    expect(pausedAgain.state).toBe("paused_valid");
    expect(expired.state).toBe("paused_expired");
    expect(harness.timerService.schedulePauseLimitExpiry).toHaveBeenCalled();
    expect(harness.timerService.cancelPauseLimitExpiry).toHaveBeenCalled();
  });
});
