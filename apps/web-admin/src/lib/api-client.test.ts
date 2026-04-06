import { describe, expect, it, vi } from "vitest";
import { createApiClient, ApiError } from "./api-client";

describe("web admin api client", () => {
  it("normalizes an admin session from login", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          token: "stub-token",
          user: {
            id: "user_1",
            email: "admin@medstudy.local",
            role: "student",
            status: "active",
            createdAt: "2026-04-06T10:00:00.000Z",
            updatedAt: "2026-04-06T10:00:00.000Z"
          }
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const client = createApiClient("http://localhost:3000", fetchImpl);
    const session = await client.login("admin@medstudy.local", "secret");

    expect(session.adminRole).toBe("admin");
    expect(session.user.role).toBe("admin");
  });

  it("throws authentication expired on 401", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({}), { status: 401 })) as unknown as typeof fetch;
    const client = createApiClient("http://localhost:3000", fetchImpl);

    await expect(
      client.me({
        token: "stub",
        adminRole: "admin",
        user: {
          id: "user_1",
          email: "admin@medstudy.local",
          role: "admin",
          status: "active",
          createdAt: "2026-04-06T10:00:00.000Z",
          updatedAt: "2026-04-06T10:00:00.000Z"
        }
      })
    ).rejects.toBeInstanceOf(ApiError);
  });
});
