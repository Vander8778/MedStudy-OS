import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBackendE2EApp, seedActiveSession, seedContractFixture } from "./helpers";

describe("admin-like actions e2e", () => {
  let context: Awaited<ReturnType<typeof createBackendE2EApp>> | undefined;

  function getContext() {
    if (!context) {
      throw new Error("E2E context not initialized.");
    }

    return context;
  }

  beforeEach(async () => {
    context = await createBackendE2EApp("admin-actions");
  });

  afterEach(async () => {
    await context?.close();
  });

  it("persists penalize and excuse actions through the live HTTP stack", async () => {
    const e2e = getContext();
    const { contract } = await seedContractFixture(e2e.prisma);
    const sessionId = await seedActiveSession(e2e.prisma, {
      contractId: contract.id,
      state: "failed"
    });

    const penalizeResponse = await request(e2e.app.getHttpServer())
      .post(`/api/sessions/${sessionId}/penalize`)
      .send({
        actor: {
          actorType: "admin",
          userId: "admin_fixture",
          label: "admin.e2e"
        }
      });

    expect(penalizeResponse.status, JSON.stringify(penalizeResponse.body)).toBe(201);
    expect(penalizeResponse.body.session.state).toBe("penalized");

    const persistedPenalty = await e2e.prisma.penalty.findFirstOrThrow({
      where: { sessionId }
    });
    expect(persistedPenalty.status).toBe("active");

    const sessionId2 = await seedActiveSession(e2e.prisma, {
      sessionId: "session_excuse",
      userId: "user_fixture",
      profileId: "profile_fixture",
      contractId: contract.id,
      state: "failed"
    });

    const excuseResponse = await request(e2e.app.getHttpServer())
      .post(`/api/sessions/${sessionId2}/excuse`)
      .send({
        actor: {
          actorType: "admin",
          userId: "admin_fixture",
          label: "admin.e2e"
        }
      });

    expect(excuseResponse.status, JSON.stringify(excuseResponse.body)).toBe(201);
    expect(excuseResponse.body.session.state).toBe("excused");
  });

  it("returns structured errors for malformed admin action payloads", async () => {
    const e2e = getContext();
    const response = await request(e2e.app.getHttpServer())
      .post("/api/sessions/session_fixture/penalize")
      .send({
        actor: {
          actorType: "not-real"
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
  });
});
