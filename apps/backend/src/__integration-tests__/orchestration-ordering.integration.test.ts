import { describe, expect, it, vi } from "vitest";
import { buildSessionAggregate } from "../__fixtures__/session.factory";

describe("orchestration ordering integration", () => {
  it("keeps the canonical M4 -> M3 -> final M2 order visible during review", async () => {
    const order: string[] = [];

    vi.resetModules();
    vi.doMock("@medstudy/domain", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@medstudy/domain")>();

      return {
        ...actual,
        evaluateContractRules: vi.fn((input) => {
          order.push("M4");
          return actual.evaluateContractRules(input);
        }),
        scoreSession: vi.fn((input) => {
          order.push("M3");
          return actual.scoreSession(input);
        }),
        transition: vi.fn((session, event, contract, context) => {
          if (event.type === "completed" || event.type === "partial" || event.type === "failed") {
            order.push("M2_final");
          }
          return actual.transition(session, event, contract, context);
        })
      };
    });

    const { SessionOrchestrator } = await import("../modules/session/session.orchestrator");
    const aggregate = buildSessionAggregate({
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
          score: 88,
          passingScore: 70,
          completedAt: "2026-04-07T09:54:00.000Z",
          createdAt: "2026-04-07T09:50:00.000Z",
          updatedAt: "2026-04-07T09:54:00.000Z"
        }
      ]
    });
    const sessionRepository = {
      withTransaction: vi.fn(async <T>(callback: (db: never) => Promise<T>) =>
        callback({} as never)
      ),
      findSessionAggregateOrThrow: vi.fn(async () => aggregate),
      saveSession: vi.fn(async (session) => session),
      saveSessionEvent: vi.fn(async (event) => event)
    };
    const auditService = {
      saveDomainEvents: vi.fn(async () => undefined),
      saveContractEvaluation: vi.fn(async () => undefined),
      saveScoringResult: vi.fn(async () => undefined)
    };
    const orchestrator = new SessionOrchestrator(
      sessionRepository as never,
      auditService as never,
      {
        clearAllForSession: vi.fn(),
        scheduleCheckpointDueChecks: vi.fn(),
        scheduleSessionReview: vi.fn(),
        schedulePeriodicAvoidanceCheck: vi.fn(),
        schedulePauseLimitExpiry: vi.fn(),
        scheduleWarningGraceExpiry: vi.fn(),
        cancelWarningGraceExpiry: vi.fn(),
        cancelPauseLimitExpiry: vi.fn()
      } as never,
      { notify: vi.fn() } as never,
      { getContract: vi.fn(async () => aggregate.contract) } as never
    );

    const result = await orchestrator.requestReview("session_fixture");

    expect(result.session.state).toBe("completed");
    expect(order).toContain("M4");
    expect(order).toContain("M3");
    expect(order).toContain("M2_final");
    expect(order.indexOf("M4")).toBeLessThan(order.indexOf("M3"));
    expect(order.indexOf("M3")).toBeLessThan(order.indexOf("M2_final"));
  });
});
