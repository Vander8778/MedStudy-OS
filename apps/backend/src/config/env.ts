import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    SERVICE_NAME: z.string().min(1).default("backend"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DATABASE_URL: z.string().trim().optional(),
    REDIS_URL: z.string().trim().optional(),
    CORS_ORIGINS: z.string().default("*"),
    ANTHROPIC_API_KEY: z.string().trim().optional(),
    ANTHROPIC_MODEL: z.string().trim().default("claude-3-5-sonnet-latest"),
    AI_MAX_TOKENS: z.coerce.number().int().positive().default(1500),
    AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.2),
    AI_AUDIT_LEVEL: z.enum(["minimal", "validated_output", "full"]).default("minimal"),
    S3_BUCKET: z.string().trim().optional(),
    S3_ENDPOINT: z.string().trim().optional(),
    S3_ACCESS_KEY: z.string().trim().optional(),
    S3_SECRET_KEY: z.string().trim().optional(),
    HEALTH_DEEP_TOKEN: z.string().trim().optional(),
    REVIEW_PENDING_STUCK_MINUTES: z.coerce.number().int().positive().default(30),
    HEALTH_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000)
  })
  .superRefine((input, ctx) => {
    if (!input.DATABASE_URL && input.NODE_ENV === "production") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL is required in production."
      });
    }

    if (!input.REDIS_URL && input.NODE_ENV === "production") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "REDIS_URL is required in production."
      });
    }
  });

export type AppEnv = ReturnType<typeof parseEnv>;

let cachedEnv: AppEnv | undefined;

export function parseEnv(source: NodeJS.ProcessEnv) {
  const parsed = envSchema.parse(source);
  const corsOrigins =
    parsed.CORS_ORIGINS.trim() === "*"
      ? ["*"]
      : parsed.CORS_ORIGINS.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    serviceName: parsed.SERVICE_NAME,
    logLevel: parsed.LOG_LEVEL,
    databaseUrl:
      parsed.DATABASE_URL ??
      (parsed.NODE_ENV === "production" ? undefined : "file:./dev.db"),
    redisUrl:
      parsed.REDIS_URL ??
      (parsed.NODE_ENV === "production" ? undefined : "redis://127.0.0.1:6379"),
    corsOrigins,
    anthropicApiKey: parsed.ANTHROPIC_API_KEY,
    anthropicModel: parsed.ANTHROPIC_MODEL,
    aiMaxTokens: parsed.AI_MAX_TOKENS,
    aiTemperature: parsed.AI_TEMPERATURE,
    aiAuditLevel: parsed.AI_AUDIT_LEVEL,
    s3Bucket: parsed.S3_BUCKET,
    s3Endpoint: parsed.S3_ENDPOINT,
    s3AccessKey: parsed.S3_ACCESS_KEY,
    s3SecretKey: parsed.S3_SECRET_KEY,
    healthDeepToken: parsed.HEALTH_DEEP_TOKEN,
    reviewPendingStuckMinutes: parsed.REVIEW_PENDING_STUCK_MINUTES,
    healthTimeoutMs: parsed.HEALTH_TIMEOUT_MS
  };
}

export function getEnv() {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}

export function resetEnvForTests() {
  cachedEnv = undefined;
}
