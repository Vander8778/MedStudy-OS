import { afterEach, describe, expect, it } from "vitest";
import { parseEnv, resetEnvForTests } from "./env";

describe("env config", () => {
  afterEach(() => {
    resetEnvForTests();
  });

  it("provides safe defaults for local development", () => {
    const env = parseEnv({});

    expect(env.nodeEnv).toBe("development");
    expect(env.port).toBe(3001);
    expect(env.databaseUrl).toBe("file:./dev.db");
    expect(env.redisUrl).toBe("redis://127.0.0.1:6379");
    expect(env.corsOrigins).toEqual(["*"]);
  });

  it("fails fast when production is missing required infra config", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production"
      })
    ).toThrow(/DATABASE_URL is required in production/);
  });

  it("requires a deep health token in production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        DATABASE_URL: "file:./prod.db",
        REDIS_URL: "redis://redis:6379"
      })
    ).toThrow(/HEALTH_DEEP_TOKEN is required in production/);
  });

  it("parses csv cors origins and numeric overrides", () => {
    const env = parseEnv({
      DATABASE_URL: "file:./custom.db",
      REDIS_URL: "redis://redis:6379",
      CORS_ORIGINS: "https://admin.local, https://api.local",
      PORT: "4000",
      AI_MAX_TOKENS: "2048"
    });

    expect(env.port).toBe(4000);
    expect(env.aiMaxTokens).toBe(2048);
    expect(env.corsOrigins).toEqual(["https://admin.local", "https://api.local"]);
  });
});
