import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionController } from "../session.controller";

function createSession(state = "active_valid") {
  return {
    id: "session_1",
    userId: "user_1",
    profileId: "profile_1",
    contractId: "contract_1",
    title: "Lifecycle session",
    objective: "Verify controller mapping",
    state,
    plannedRange: {
      startsAt: "2026-03-29T09:00:00.000Z",
      endsAt: "2026-03-29T11:00:00.000Z"
    },
    validMinutes: 30,
    invalidMinutes: 0,
    warningCount: 1,
    missedCheckpointCount: 0,
    finalArtifactRequired: true,
    blockIds: ["block_1"],
    checkpointIds: ["checkpoint_1"],
    artifactIds: ["artifact_1"],
    evaluationIds: [],
    vivaAttemptIds: ["viva_1"],
    penaltyIds: ["penalty_1"],
    metadata: { hidden: true },
    createdAt: "2026-03-29T08:55:00.000Z",
    updatedAt: "2026-03-29T09:05:00.000Z"
  };
}

function createAggregate() {
  return {
    session: createSession(),
    contract: {
      id: "contract_1",
      userId: "user_1",
      name: "Core contract",
      description: "Contract description",
      status: "active",
      terms: {
        minValidMinutes: 60,
        maxMissedCheckpoints: 1,
        mandatoryArtifactTypes: ["final_submission"],
        vivaPassingScore: 70,
        checkpointIntervalMinutes: 30,
        maxPauseMinutes: 10
      },
      activeRange: {
        startsAt: "2026-03-29T09:00:00.000Z",
        endsAt: "2026-03-29T11:00:00.000Z"
      },
      tags: ["focus"],
      metadata: { hidden: true },
      createdAt: "2026-03-29T08:00:00.000Z",
      updatedAt: "2026-03-29T08:00:00.000Z"
    },
    checkpoints: [
      {
        id: "checkpoint_1",
        sessionId: "session_1",
        order: 1,
        title: "Checkpoint 1",
        status: "pending",
        dueAt: "2026-03-29T09:30:00.000Z",
        createdAt: "2026-03-29T08:55:00.000Z",
        updatedAt: "2026-03-29T08:55:00.000Z"
      }
    ],
    artifacts: [
      {
        id: "artifact_1",
        sessionId: "session_1",
        type: "final_submission",
        source: "user_upload",
        status: "submitted",
        title: "Final artifact",
        isMandatory: true,
        createdAt: "2026-03-29T09:10:00.000Z",
        updatedAt: "2026-03-29T09:10:00.000Z"
      }
    ],
    vivaAttempts: [
      {
        id: "viva_1",
        sessionId: "session_1",
        status: "passed",
        score: 82,
        passingScore: 70,
        createdAt: "2026-03-29T10:00:00.000Z",
        updatedAt: "2026-03-29T10:00:00.000Z"
      }
    ],
    blocks: [
      {
        id: "block_1",
        sessionId: "session_1",
        type: "study",
        range: {
          startsAt: "2026-03-29T09:00:00.000Z",
          endsAt: "2026-03-29T09:30:00.000Z"
        },
        creditedMinutes: 30,
        createdAt: "2026-03-29T09:00:00.000Z",
        updatedAt: "2026-03-29T09:30:00.000Z"
      }
    ],
    penalties: [
      {
        id: "penalty_1",
        userId: "user_1",
        sessionId: "session_1",
        type: "warning",
        reason: "contract_violation",
        status: "active",
        issuedAt: "2026-03-29T09:20:00.000Z",
        createdAt: "2026-03-29T09:20:00.000Z",
        updatedAt: "2026-03-29T09:20:00.000Z"
      }
    ],
    events: [
      {
        id: "event_1",
        sessionId: "session_1",
        type: "started",
        actor: { actorType: "user", userId: "user_1" },
        state: "active_valid",
        occurredAt: "2026-03-29T09:00:00.000Z"
      }
    ]
  };
}

function createScoring() {
  return {
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
  };
}

describe("SessionController", () => {
  const orchestrator = {
    createSession: vi.fn(),
    getSession: vi.fn(),
    armSession: vi.fn(),
    confirmArmSession: vi.fn(),
    startSession: vi.fn(),
    pauseSession: vi.fn(),
    resumeSession: vi.fn(),
    submitArtifact: vi.fn(),
    requestReview: vi.fn(),
    penalizeSession: vi.fn(),
    excuseSession: vi.fn(),
    getSessionScoring: vi.fn(),
    getSessionEvents: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function expectOnlyCalled(target: keyof typeof orchestrator) {
    Object.entries(orchestrator).forEach(([name, spy]) => {
      expect(spy).toHaveBeenCalledTimes(name === target ? 1 : 0);
    });
  }

  it("delegates createSession once and returns a mapped aggregate response", async () => {
    orchestrator.createSession.mockResolvedValue(createAggregate());
    const controller = new SessionController(orchestrator as never);

    const result = await controller.createSession({
      userId: "user_1",
      profileId: "profile_1",
      contractId: "contract_1",
      title: "New session",
      objective: "Objective",
      plannedRange: {
        startsAt: "2026-03-29T09:00:00.000Z",
        endsAt: "2026-03-29T11:00:00.000Z"
      },
      finalArtifactRequired: true
    });

    expectOnlyCalled("createSession");
    expect(result.session.state).toBe("active_valid");
    expect("blockIds" in result.session).toBe(false);
    expect("metadata" in result.contract).toBe(false);
  });

  it("delegates getSession once and returns the mapped aggregate", async () => {
    orchestrator.getSession.mockResolvedValue(createAggregate());
    const controller = new SessionController(orchestrator as never);

    const result = await controller.getSession("session_1");

    expectOnlyCalled("getSession");
    expect(result.checkpoints).toHaveLength(1);
    expect(result.artifacts[0].type).toBe("final_submission");
  });

  it.each([
    ["armSession", "armSession"],
    ["confirmArmSession", "confirmArmSession"],
    ["startSession", "startSession"],
    ["pauseSession", "pauseSession"],
    ["penalize", "penalizeSession"],
    ["excuse", "excuseSession"]
  ] as const)(
    "delegates %s exactly once and returns SessionMutationResponse",
    async (controllerMethod, orchestratorMethod) => {
      (orchestrator[orchestratorMethod] as ReturnType<typeof vi.fn>).mockResolvedValue(
        createSession("active_valid")
      );
      const controller = new SessionController(orchestrator as never);

      const result = await (controller[controllerMethod] as (
        id: string,
        body: { actor?: { actorType: "user" } }
      ) => Promise<{ session: { state: string } }>)("session_1", {
        actor: { actorType: "user" }
      });

      expectOnlyCalled(orchestratorMethod);
      expect(result.session.state).toBe("active_valid");
      expect("artifactIds" in result.session).toBe(false);
    }
  );

  it("delegates resumeSession once with the provided reason", async () => {
    orchestrator.resumeSession.mockResolvedValue(createSession("active_valid"));
    const controller = new SessionController(orchestrator as never);

    const result = await controller.resumeSession("session_1", {
      actor: { actorType: "user" },
      reason: "pause_within_limit"
    });

    expectOnlyCalled("resumeSession");
    expect(orchestrator.resumeSession).toHaveBeenCalledWith(
      "session_1",
      "pause_within_limit",
      { actorType: "user" }
    );
    expect(result.session.state).toBe("active_valid");
  });

  it("delegates submitArtifact once and returns ArtifactView", async () => {
    orchestrator.submitArtifact.mockResolvedValue(createAggregate().artifacts[0]);
    const controller = new SessionController(orchestrator as never);

    const result = await controller.submitArtifact("session_1", {
      type: "final_submission",
      title: "Artifact",
      source: "user_upload",
      status: "submitted"
    });

    expectOnlyCalled("submitArtifact");
    expect(result.artifact.type).toBe("final_submission");
    expect("metadata" in result.artifact).toBe(false);
  });

  it("delegates requestReview once and returns the enriched review response", async () => {
    orchestrator.requestReview.mockResolvedValue({
      session: createSession("completed"),
      scoring: createScoring(),
      contractEvaluation: {
        allRulesPassed: true,
        hasCriticalViolation: false,
        rules: [],
        criticalViolations: [],
        warnings: [{ code: "pause_exceeded" }],
        informational: [{ code: "viva_passed" }]
      }
    });
    const controller = new SessionController(orchestrator as never);

    const result = await controller.requestReview("session_1", {
      actor: { actorType: "user" }
    });

    expectOnlyCalled("requestReview");
    expect(result.contractEvaluation.warningCodes).toEqual(["pause_exceeded"]);
    expect(result.scoring.hardFailTriggered).toBe(false);
  });

  it("delegates getScoring once and returns GetScoringResponse", async () => {
    orchestrator.getSessionScoring.mockResolvedValue(createScoring());
    const controller = new SessionController(orchestrator as never);

    const result = await controller.getScoring("session_1");

    expectOnlyCalled("getSessionScoring");
    expect(result.scoring?.sessionScore).toBe(91);
  });

  it("returns scoring: null when no scoring result exists yet", async () => {
    orchestrator.getSessionScoring.mockResolvedValue(null);
    const controller = new SessionController(orchestrator as never);

    const result = await controller.getScoring("session_1");

    expectOnlyCalled("getSessionScoring");
    expect(result).toEqual({ scoring: null });
  });

  it("delegates getEvents once and returns GetEventsResponse", async () => {
    orchestrator.getSessionEvents.mockResolvedValue(createAggregate().events);
    const controller = new SessionController(orchestrator as never);

    const result = await controller.getEvents("session_1");

    expectOnlyCalled("getSessionEvents");
    expect(result.events[0].type).toBe("started");
  });
});
