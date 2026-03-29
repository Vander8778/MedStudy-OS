import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiErrorFilter } from "../../../common/api-error.filter";
import { SessionController } from "../session.controller";
import { SessionOrchestrator } from "../session.orchestrator";

function createSession(state = "active_valid") {
  return {
    id: "session_1",
    userId: "user_1",
    profileId: "profile_1",
    contractId: "contract_1",
    title: "Lifecycle session",
    objective: "Verify HTTP mapping",
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
    events: []
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
    decisionTrace: {
      decidedByHardFail: false,
      scoreThresholdApplied: {
        min: 85,
        max: 100,
        outcome: "completed"
      }
    }
  };
}

describe("SessionController HTTP", () => {
  let app: INestApplication;
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

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionOrchestrator,
          useValue: orchestrator
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new ApiErrorFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 422 validation.invalid_input for malformed create-session bodies", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/sessions")
      .send({
        userId: "user_1",
        profileId: "profile_1",
        contractId: "contract_1",
        title: "   ",
        objective: "Objective",
        plannedRange: {
          startsAt: "2026-03-29T09:00:00.000Z",
          endsAt: "2026-03-29T11:00:00.000Z"
        },
        finalArtifactRequired: true
      });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: {
        code: "validation.invalid_input",
        message: "Request validation failed.",
        details: {
          issues: [
            expect.objectContaining({
              path: "title"
            })
          ]
        }
      }
    });
    expect(orchestrator.createSession).not.toHaveBeenCalled();
  });

  it("returns 422 validation.invalid_input for invalid planned ranges", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/sessions")
      .send({
        userId: "user_1",
        profileId: "profile_1",
        contractId: "contract_1",
        title: "New session",
        objective: "Objective",
        plannedRange: {
          startsAt: "2026-03-29T11:00:00.000Z",
          endsAt: "2026-03-29T09:00:00.000Z"
        },
        finalArtifactRequired: true
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
    expect(response.body.error.details.issues).toEqual([
      expect.objectContaining({
        path: "plannedRange"
      })
    ]);
    expect(orchestrator.createSession).not.toHaveBeenCalled();
  });

  it("returns 422 validation.invalid_input for invalid artifact enums", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/sessions/session_1/submit-artifact")
      .send({
        type: "not_a_real_artifact",
        title: "Artifact",
        source: "user_upload",
        status: "submitted"
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
    expect(response.body.error.details.issues).toEqual([
      expect.objectContaining({
        path: "type"
      })
    ]);
    expect(orchestrator.submitArtifact).not.toHaveBeenCalled();
  });

  it("returns the aggregate session read model shape from GET /api/sessions/:id", async () => {
    orchestrator.getSession.mockResolvedValue(createAggregate());

    const response = await request(app.getHttpServer()).get("/api/sessions/session_1");

    expect(response.status).toBe(200);
    expect(orchestrator.getSession).toHaveBeenCalledWith("session_1");
    expect(response.body).toMatchObject({
      session: {
        id: "session_1",
        state: "active_valid",
        plannedRange: {
          startsAt: "2026-03-29T09:00:00.000Z",
          endsAt: "2026-03-29T11:00:00.000Z"
        }
      },
      contract: {
        id: "contract_1",
        status: "active"
      },
      checkpoints: [
        {
          id: "checkpoint_1"
        }
      ],
      artifacts: [
        {
          id: "artifact_1"
        }
      ],
      vivaAttempts: [
        {
          id: "viva_1"
        }
      ],
      blocks: [
        {
          id: "block_1"
        }
      ],
      penalties: [
        {
          id: "penalty_1"
        }
      ]
    });
    expect(response.body.session.blockIds).toBeUndefined();
    expect(response.body.session.metadata).toBeUndefined();
    expect(response.body.contract.metadata).toBeUndefined();
  });

  it("returns 422 validation.invalid_input for blank session route params", async () => {
    const response = await request(app.getHttpServer()).get("/api/sessions/%20%20");

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
    expect(response.body.error.details.issues).toEqual([
      expect.objectContaining({
        path: ""
      })
    ]);
    expect(orchestrator.getSession).not.toHaveBeenCalled();
  });

  it("returns 422 validation.invalid_input for blank session ids on POST endpoints", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/sessions/%20%20/pause")
      .send({
        actor: {
          actorType: "user"
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
    expect(response.body.error.details.issues).toEqual([
      expect.objectContaining({
        path: ""
      })
    ]);
    expect(orchestrator.pauseSession).not.toHaveBeenCalled();
  });

  it("returns the enriched review result response from POST /api/sessions/:id/request-review", async () => {
    orchestrator.requestReview.mockResolvedValue({
      session: createSession("completed"),
      scoring: createScoring(),
      contractEvaluation: {
        allRulesPassed: false,
        hasCriticalViolation: true,
        rules: [],
        criticalViolations: [{ code: "pause_exceeded" }],
        warnings: [{ code: "viva_failed" }],
        informational: [{ code: "valid_time_met" }]
      }
    });

    const response = await request(app.getHttpServer())
      .post("/api/sessions/session_1/request-review")
      .send({
        actor: {
          actorType: "user",
          userId: "user_1"
        }
      });

    expect(response.status).toBe(201);
    expect(orchestrator.requestReview).toHaveBeenCalledWith("session_1", {
      actor: {
        actorType: "user",
        userId: "user_1"
      }
    });
    expect(response.body).toEqual({
      session: expect.objectContaining({
        id: "session_1",
        state: "completed"
      }),
      scoring: {
        outcome: "completed",
        sessionScore: 91,
        components: {
          validTime: { raw: 100, weight: 0.35, weighted: 35 },
          process: { raw: 90, weight: 0.2, weighted: 18 },
          artifact: { raw: 100, weight: 0.25, weighted: 25 },
          knowledge: { raw: 65, weight: 0.2, weighted: 13 }
        },
        hardFailTriggered: false,
        hardFailReasons: [],
        decisionTrace: {
          decidedByHardFail: false,
          scoreThresholdApplied: {
            min: 85,
            max: 100,
            outcome: "completed"
          }
        }
      },
      contractEvaluation: {
        allRulesPassed: false,
        hasCriticalViolation: true,
        criticalViolationCodes: ["pause_exceeded"],
        warningCodes: ["viva_failed"],
        informationalCodes: ["valid_time_met"]
      }
    });
  });
});
