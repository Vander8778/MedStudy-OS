import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredAuthSession,
  login,
  readStoredAuthSession,
  refreshSessionTokens,
  setSecureStoreForTests,
  writeStoredAuthSession
} from "./auth-service";

function createSecureStore() {
  const values = new Map<string, string>();
  return {
    getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      values.delete(key);
    })
  };
}

describe("auth service", () => {
  beforeEach(() => {
    setSecureStoreForTests(createSecureStore());
  });

  it("stores and clears auth session lifecycle", async () => {
    await writeStoredAuthSession({
      tokens: {
        accessToken: "access",
        refreshToken: "refresh"
      },
      user: {
        id: "user_1",
        email: "demo@example.com",
        role: "student",
        status: "active",
        createdAt: "2026-04-05T10:00:00.000Z",
        updatedAt: "2026-04-05T10:00:00.000Z"
      }
    });

    expect((await readStoredAuthSession())?.tokens.accessToken).toBe("access");
    await clearStoredAuthSession();
    expect(await readStoredAuthSession()).toBeNull();
  });

  it("parses login and refresh responses", async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.refreshToken) {
        return new Response(
          JSON.stringify({
            accessToken: "next-access",
            refreshToken: "next-refresh"
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          accessToken: "access",
          refreshToken: "refresh",
          user: {
            id: "user_1",
            email: "demo@example.com",
            role: "student",
            status: "active",
            createdAt: "2026-04-05T10:00:00.000Z",
            updatedAt: "2026-04-05T10:00:00.000Z"
          }
        }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;

    const session = await login(
      "http://localhost:3000/api",
      { email: "demo@example.com", password: "secret" },
      fetchImpl
    );
    expect(session.tokens.refreshToken).toBe("refresh");

    const refreshed = await refreshSessionTokens(
      "http://localhost:3000/api",
      "refresh",
      fetchImpl
    );
    expect(refreshed.accessToken).toBe("next-access");
  });
});
