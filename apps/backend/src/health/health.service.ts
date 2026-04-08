import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { getEnv } from "../config/env";

type HealthCheckResult = {
  ok: boolean;
  details: Record<string, unknown>;
};

@Injectable()
export class HealthService implements OnModuleDestroy {
  private redis?: Redis;

  constructor(private readonly prisma: PrismaService) {}

  private getRedisClient() {
    const env = getEnv();
    if (!env.redisUrl) {
      return undefined;
    }

    this.redis ??= new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });

    return this.redis;
  }

  private getMigrationsRoot() {
    return path.resolve(__dirname, "..", "..", "prisma", "migrations");
  }

  private getExpectedMigrationCount() {
    const migrationsRoot = this.getMigrationsRoot();
    if (!existsSync(migrationsRoot)) {
      return 0;
    }

    return readdirSync(migrationsRoot, { withFileTypes: true }).filter((entry) =>
      entry.isDirectory()
    ).length;
  }

  private async getAppliedMigrationCount() {
    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number | bigint }>>(
        'SELECT COUNT(*) as count FROM "_prisma_migrations"'
      );
      const count = rows[0]?.count;
      return typeof count === "bigint" ? Number(count) : Number(count ?? 0);
    } catch {
      return 0;
    }
  }

  private async withTimeout<T>(operation: Promise<T>) {
    const env = getEnv();
    return Promise.race<T>([
      operation,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Timed out.")), env.healthTimeoutMs)
      )
    ]);
  }

  async getLiveness() {
    return {
      ok: true,
      service: getEnv().serviceName,
      timestamp: new Date().toISOString()
    };
  }

  async getReadiness(): Promise<HealthCheckResult> {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    const migrations = await this.checkMigrations();

    return {
      ok: database.ok && redis.ok && migrations.ok,
      details: {
        timestamp: new Date().toISOString(),
        database,
        redis,
        migrations
      }
    };
  }

  async getDeepHealth(): Promise<HealthCheckResult> {
    const readiness = await this.getReadiness();
    const objectStorage = await this.checkObjectStorage();
    const aiProvider = await this.checkAiProvider();

    return {
      ok: readiness.ok && objectStorage.ok && aiProvider.ok,
      details: {
        ...readiness.details,
        objectStorage,
        aiProvider
      }
    };
  }

  private async checkDatabase() {
    try {
      await this.withTimeout(this.prisma.$queryRawUnsafe("SELECT 1"));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Database unavailable."
      };
    }
  }

  private async checkRedis() {
    const client = this.getRedisClient();
    if (!client) {
      return {
        ok: getEnv().nodeEnv !== "production",
        skipped: true,
        reason: "REDIS_URL is not configured."
      };
    }

    try {
      await this.withTimeout(client.ping());
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Redis unavailable."
      };
    }
  }

  private async checkMigrations() {
    const expected = this.getExpectedMigrationCount();
    const applied = await this.getAppliedMigrationCount();

    return {
      ok: expected === applied,
      expected,
      applied
    };
  }

  private async checkObjectStorage() {
    const env = getEnv();
    if (!env.s3Endpoint || !env.s3Bucket) {
      return {
        ok: true,
        skipped: true,
        reason: "Object storage is not configured."
      };
    }

    try {
      const response = await this.withTimeout(fetch(env.s3Endpoint, { method: "GET" }));
      return {
        ok: response.ok || response.status < 500,
        status: response.status
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Object storage unreachable."
      };
    }
  }

  private async checkAiProvider() {
    const env = getEnv();
    return {
      ok: Boolean(env.anthropicApiKey),
      configured: Boolean(env.anthropicApiKey),
      model: env.anthropicModel,
      note: env.anthropicApiKey
        ? "Passive configuration check only at MVP."
        : "ANTHROPIC_API_KEY is not configured."
    };
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.redis = undefined;
    }
  }
}
