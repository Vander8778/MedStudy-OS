import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBackendE2EApp } from "./helpers";

describe("auth boundaries e2e", () => {
  let context: Awaited<ReturnType<typeof createBackendE2EApp>> | undefined;

  function getContext() {
    if (!context) {
      throw new Error("E2E context not initialized.");
    }

    return context;
  }

  beforeEach(async () => {
    context = await createBackendE2EApp("auth-boundaries");
  });

  afterEach(async () => {
    await context?.close();
  });

  it("serves the current stub auth contract through the real HTTP stack", async () => {
    const e2e = getContext();
    const loginResponse = await request(e2e.app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "student@medstudy.local"
      });
    const meResponse = await request(e2e.app.getHttpServer()).get("/api/auth/me");

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body).toMatchObject({
      token: expect.stringContaining("stub-token"),
      user: {
        email: "student@medstudy.local",
        role: "student"
      }
    });
    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual({
      id: "user_demo",
      email: "demo@medstudy.local",
      role: "student"
    });
  });

  it("rejects malformed login payloads with a structured error envelope", async () => {
    const e2e = getContext();
    const response = await request(e2e.app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "not-an-email"
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("validation.invalid_input");
  });
});
