import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "./api-client";
import type { AuthSession } from "../types/app";

describe("mobile api client", () => {
  let authSession: AuthSession | null;

  beforeEach(() => {
    authSession = {
      tokens: {
        accessToken: "expired-access",
        refreshToken: "refresh-token"
      },
      user: {
        id: "user_1",
        email: "demo@example.com",
        role: "student",
        status: "active",
        createdAt: "2026-04-05T10:00:00.000Z",
        updatedAt: "2026-04-05T10:00:00.000Z"
      }
    };
  });

  it("refreshes once on 401 and retries the original request", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        return new Response(
          JSON.stringify({
            accessToken: "fresh-access",
            refreshToken: "fresh-refresh"
          }),
          { status: 200 }
        );
      }

      const authHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (authHeader === "Bearer expired-access") {
        return new Response(
          JSON.stringify({ error: { code: "unauthorized", message: "expired" } }),
          { status: 401 }
        );
      }

      return new Response(
        JSON.stringify({
          user: authSession?.user,
          profile: {
            id: "profile_1",
            userId: "user_1",
            displayName: "Ada",
            timezone: "Europe/Moscow",
            locale: "en-US",
            studyStage: "clinical",
            createdAt: "2026-04-05T10:00:00.000Z",
            updatedAt: "2026-04-05T10:00:00.000Z"
          }
        }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;

    const client = createApiClient({
      backendUrl: "http://localhost:3000/api",
      fetchImpl,
      getAuthSession: async () => authSession,
      onAuthSession: async (next) => {
        authSession = next;
      }
    });

    const me = await client.me();
    expect(me.user.id).toBe("user_1");
    expect(authSession?.tokens.accessToken).toBe("fresh-access");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("clears auth session when refresh fails", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        return new Response(
          JSON.stringify({ error: { code: "unauthorized", message: "refresh expired" } }),
          { status: 401 }
        );
      }

      const authHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (authHeader === "Bearer expired-access") {
        return new Response(
          JSON.stringify({ error: { code: "unauthorized", message: "expired" } }),
          { status: 401 }
        );
      }

      return new Response(JSON.stringify({}), { status: 500 });
    }) as unknown as typeof fetch;

    const client = createApiClient({
      backendUrl: "http://localhost:3000/api",
      fetchImpl,
      getAuthSession: async () => authSession,
      onAuthSession: async (next) => {
        authSession = next;
      }
    });

    await expect(client.me()).rejects.toMatchObject({
      message: "Authentication expired.",
      status: 401
    });
    expect(authSession).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
