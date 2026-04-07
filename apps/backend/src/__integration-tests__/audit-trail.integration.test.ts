import { describe, expect, it } from "vitest";
import { buildSessionAggregate } from "../__fixtures__/session.factory";
import { createSessionIntegrationHarness } from "./helpers";

describe("audit trail integration", () => {
  it("records review explainability artifacts, penalties, and avoidance references", async () => {
    const harness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "active_valid",
          startedAt: "2026-04-07T09:00:00.000Z",
          validMinutes: 55
        },
        artifacts: [
          {
            id: "artifact_final",
            sessionId: "session_fixture",
            type: "final_submission",
            source: "user_upload",
            status: "submitted",
            title: "Final artifact",
            isMandatory: true,
            createdAt: "2026-04-07T09:50:00.000Z",
            updatedAt: "2026-04-07T09:50:00.000Z"
          }
        ],
        vivaAttempts: [
          {
            id: "viva_pass",
            sessionId: "session_fixture",
            status: "passed",
            score: 90,
            passingScore: 70,
            completedAt: "2026-04-07T09:54:00.000Z",
            createdAt: "2026-04-07T09:50:00.000Z",
            updatedAt: "2026-04-07T09:54:00.000Z"
          }
        ]
      })
    );

    await harness.orchestrator.requestReview("session_fixture");

    const penaltyHarness = createSessionIntegrationHarness(
      buildSessionAggregate({
        session: {
          state: "failed",
          startedAt: "2026-04-07T09:00:00.000Z"
        }
      })
    );
    await penaltyHarness.orchestrator.penalizeSession("session_fixture", {
      actorType: "admin",
      userId: "admin_fixture",
      label: "integration.audit"
    });
    await penaltyHarness.orchestrator.processAvoidanceAssessment("session_fixture", {
      patterns: [
        {
          pattern: "active_warning_escalation",
          detected: true,
          severity: "critical",
          message: "Critical escalation",
          details: { source: "integration.test" }
        }
      ],
      overallSeverity: "critical",
      hasEscalationSignal: true,
      recommendedResponses: ["flag_for_admin"]
    });

    expect(harness.state.scoring).not.toBeNull();
    expect(harness.state.contractEvaluation).not.toBeNull();
    expect(penaltyHarness.state.antiAvoidanceResults).toHaveLength(1);
    expect(penaltyHarness.getAggregate().penalties).toHaveLength(1);
    expect(penaltyHarness.getAggregate().events.map((event) => event.type)).toContain(
      "penalized"
    );
    expect(penaltyHarness.state.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "avoidance.flag_for_admin",
          sessionId: "session_fixture"
        })
      ])
    );
  });
});
