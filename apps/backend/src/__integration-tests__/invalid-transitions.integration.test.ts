import { describe, expect, it } from "vitest";
import {
  SessionAlreadyDecidedException,
  SessionInvalidTransitionException
} from "../common/exceptions";
import { buildSessionAggregate } from "../__fixtures__/session.factory";
import { createSessionIntegrationHarness } from "./helpers";

describe("invalid transition integration", () => {
  it("rejects representative invalid lifecycle transitions", async () => {
    const plannedHarness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "planned"
        }
      })
    );
    const completedHarness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "completed",
          endedAt: "2026-04-07T10:00:00.000Z"
        }
      })
    );

    await expect(plannedHarness.orchestrator.pauseSession("session_fixture")).rejects.toBeInstanceOf(
      SessionInvalidTransitionException
    );
    await expect(completedHarness.orchestrator.requestReview("session_fixture")).rejects.toBeInstanceOf(
      SessionAlreadyDecidedException
    );
  });
});
