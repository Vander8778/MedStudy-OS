import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBackendE2EApp, seedContractFixture } from "./helpers";

describe("session API e2e", () => {
  let context: Awaited<ReturnType<typeof createBackendE2EApp>> | undefined;

  function getContext() {
    if (!context) {
      throw new Error("E2E context not initialized.");
    }

    return context;
  }

  beforeEach(async () => {
    context = await createBackendE2EApp("session-api");
  });

  afterEach(async () => {
    await context?.close();
  });

  it("persists the happy path through the real Nest app and test database", async () => {
    const e2e = getContext();
    const { contract } = await seedContractFixture(e2e.prisma);
    const plannedStartsAt = new Date(Date.now() - 60_000).toISOString();
    const plannedEndsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const createResponse = await request(e2e.app.getHttpServer())
      .post("/api/sessions")
      .send({
        userId: "user_fixture",
        profileId: "profile_fixture",
        contractId: contract.id,
        title: "E2E lifecycle",
        objective: "Validate full HTTP lifecycle",
        plannedRange: {
          startsAt: plannedStartsAt,
          endsAt: plannedEndsAt
        },
        finalArtifactRequired: true
      });

    expect(createResponse.status, JSON.stringify(createResponse.body)).toBe(201);
    const sessionId = createResponse.body.session.id as string;

    for (const path of ["arm", "confirm-arm", "start"]) {
      const response = await request(e2e.app.getHttpServer())
        .post(`/api/sessions/${sessionId}/${path}`)
        .send({
          actor: {
            actorType: "user",
            userId: "user_fixture"
          }
        });

      expect(response.status, JSON.stringify(response.body)).toBe(201);
    }

    await e2e.prisma.session.update({
      where: { id: sessionId },
      data: {
        validMinutes: 55,
        updatedAt: new Date("2036-04-07T09:55:00.000Z")
      }
    });
    await e2e.prisma.vivaAttempt.create({
      data: {
        id: "viva_session_api",
        sessionId,
        status: "passed",
        score: 90,
        passingScore: 70,
        completedAt: new Date("2036-04-07T09:54:00.000Z"),
        createdAt: new Date("2036-04-07T09:50:00.000Z"),
        updatedAt: new Date("2036-04-07T09:54:00.000Z")
      }
    });

    const artifactResponse = await request(e2e.app.getHttpServer())
      .post(`/api/sessions/${sessionId}/submit-artifact`)
      .send({
        type: "final_submission",
        title: "Final artifact",
        source: "user_upload",
        status: "submitted"
      });

    expect(artifactResponse.status, JSON.stringify(artifactResponse.body)).toBe(201);

    const reviewResponse = await request(e2e.app.getHttpServer())
      .post(`/api/sessions/${sessionId}/request-review`)
      .send({
        actor: {
          actorType: "user",
          userId: "user_fixture"
        }
      });

    expect(reviewResponse.status, JSON.stringify(reviewResponse.body)).toBe(201);
    expect(reviewResponse.body.session.state).toBe("completed");

    const scoringResponse = await request(e2e.app.getHttpServer()).get(
      `/api/sessions/${sessionId}/scoring`
    );
    const sessionResponse = await request(e2e.app.getHttpServer()).get(
      `/api/sessions/${sessionId}`
    );

    expect(scoringResponse.status).toBe(200);
    expect(scoringResponse.body.scoring.outcome).toBe("completed");
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.session.state).toBe("completed");

    const persisted = await e2e.prisma.session.findUniqueOrThrow({
      where: { id: sessionId }
    });
    expect(persisted.state).toBe("completed");
  });

  it("returns structured validation errors for invalid request bodies", async () => {
    const e2e = getContext();
    const response = await request(e2e.app.getHttpServer())
      .post("/api/sessions")
      .send({
        userId: "user_fixture",
        profileId: "profile_fixture",
        contractId: "missing_contract",
        title: "   ",
        objective: "Bad body",
        plannedRange: {
          startsAt: "2036-04-07T10:00:00.000Z",
          endsAt: "2036-04-07T09:00:00.000Z"
        },
        finalArtifactRequired: true
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
  });
});
