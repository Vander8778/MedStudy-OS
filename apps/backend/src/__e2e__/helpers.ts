import "reflect-metadata";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
  type INestApplication
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Contract } from "@medstudy/domain";
import type { PrismaService } from "../prisma/prisma.service";
import { ApiErrorFilter } from "../common/api-error.filter";
import { buildContract } from "../__fixtures__/contract.factory";
import { buildUser } from "../__fixtures__/user.factory";

const backendRoot = path.resolve(__dirname, "..", "..");
const migrationsRoot = path.join(backendRoot, "prisma", "migrations");
const tempRuntimeDir = path.join(os.tmpdir(), "medstudy-m14-prisma");

// This E2E bootstrap intentionally uses the real Nest modules plus a real migrated test
// database. The explicit provider overrides below keep those services bound to the test
// Prisma instance; if SessionOrchestrator or related services gain new constructor
// dependencies, this helper must be updated so the test module stays production-faithful.

class E2EApiErrorFilter extends ApiErrorFilter implements ExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof Error && !(exception instanceof HttpException)) {
      host
        .switchToHttp()
        .getResponse<{
          status: (code: number) => { json: (body: unknown) => void };
        }>()
        .status(500)
        .json({
          error: {
            code: "internal.unknown",
            message: exception.message,
            details: {
              name: exception.name
            }
          }
        });
      return;
    }

    super.catch(exception, host);
  }
}

function toSqliteUrl(filePath: string) {
  return `file:${filePath.replace(/\\/g, "/")}`;
}

function applySqliteMigrations(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  const migrationDirectories = readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const migrationDirectory of migrationDirectories) {
    const migrationPath = path.join(migrationsRoot, migrationDirectory, "migration.sql");
    if (!existsSync(migrationPath)) {
      continue;
    }

    db.exec(readFileSync(migrationPath, "utf8"));
  }

  db.close();
}

function prepareDatabase(name: string) {
  mkdirSync(tempRuntimeDir, { recursive: true });
  const dbPath = path.join(
    tempRuntimeDir,
    `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );

  try {
    applySqliteMigrations(dbPath);
  } catch (error) {
    throw new Error(
      `SQLite migration setup failed for ${name}: ${
        error instanceof Error ? error.message : "Unknown migration error."
      }`
    );
  }

  return { dbPath };
}

export async function createBackendE2EApp(name: string) {
  const { dbPath } = prepareDatabase(name);
  process.env.DATABASE_URL = toSqliteUrl(dbPath);

  const { PrismaService } = await import("../prisma/prisma.service");
  const { PrismaModule } = await import("../prisma/prisma.module");
  const { AuditRepository } = await import("../modules/audit/audit.repository");
  const { AuditService } = await import("../modules/audit/audit.service");
  const { AuditModule } = await import("../modules/audit/audit.module");
  const { NotificationService } = await import("../modules/notification/notification.service");
  const { NotificationModule } = await import("../modules/notification/notification.module");
  const { ContractRepository } = await import("../modules/contract/contract.repository");
  const { ContractService } = await import("../modules/contract/contract.service");
  const { ContractModule } = await import("../modules/contract/contract.module");
  const { TimerService } = await import("../modules/timer/timer.service");
  const { TimerModule } = await import("../modules/timer/timer.module");
  const { SessionOrchestrator } = await import("../modules/session/session.orchestrator");
  const { SessionRepository } = await import("../modules/session/session.repository");
  const { SessionModule } = await import("../modules/session/session.module");
  const { AuthModule } = await import("../modules/auth/auth.module");
  const moduleRef = await Test.createTestingModule({
    imports: [
      PrismaModule,
      AuditModule,
      NotificationModule,
      ContractModule,
      TimerModule,
      SessionModule,
      AuthModule
    ]
  })
    .overrideProvider(SessionRepository)
    .useFactory({
      factory: (prisma: PrismaService) => new SessionRepository(prisma),
      inject: [PrismaService]
    })
    .overrideProvider(ContractRepository)
    .useFactory({
      factory: (prisma: PrismaService) => new ContractRepository(prisma),
      inject: [PrismaService]
    })
    .overrideProvider(ContractService)
    .useFactory({
      factory: (contractRepository: ContractRepository) =>
        new ContractService(contractRepository),
      inject: [ContractRepository]
    })
    .overrideProvider(AuditRepository)
    .useFactory({
      factory: (prisma: PrismaService) => new AuditRepository(prisma),
      inject: [PrismaService]
    })
    .overrideProvider(AuditService)
    .useFactory({
      factory: (auditRepository: AuditRepository) => new AuditService(auditRepository),
      inject: [AuditRepository]
    })
    .overrideProvider(SessionOrchestrator)
    .useFactory({
      factory: (
        sessionRepository: SessionRepository,
        auditService: AuditService,
        timerService: TimerService,
        notificationService: NotificationService,
        contractService: ContractService
      ) =>
        new SessionOrchestrator(
          sessionRepository,
          auditService,
          timerService,
          notificationService,
          contractService
        ),
      inject: [
        SessionRepository,
        AuditService,
        TimerService,
        NotificationService,
        ContractService
      ]
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new E2EApiErrorFilter());
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService) as PrismaService,
    async close() {
      const timerService = app.get(TimerService);
      const scheduledTimers = (
        timerService as TimerService & {
          scheduledTimers?: Map<string, ReturnType<typeof setTimeout>>;
        }
      ).scheduledTimers;
      if (scheduledTimers) {
        for (const handle of scheduledTimers.values()) {
          clearTimeout(handle);
        }
        scheduledTimers.clear();
      }

      await app.close();
      rmSync(dbPath, { force: true });
    }
  };
}

export async function seedContractFixture(
  prisma: PrismaService,
  overrides: Partial<Contract> = {}
) {
  const { user, profile } = buildUser({
    user: {
      id: overrides.userId ?? "user_fixture",
      email: "student@medstudy.local"
    },
    profile: {
      userId: overrides.userId ?? "user_fixture"
    }
  });
  const contract = buildContract({
    userId: user.id as Contract["userId"],
    ...overrides
  });

  await prisma.user.create({
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: profile.displayName,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }
  });
  await prisma.profile.create({
    data: {
      id: profile.id,
      userId: profile.userId,
      timezone: profile.timezone,
      studyStage: profile.studyStage,
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt)
    }
  });
  await prisma.contract.create({
    data: {
      id: contract.id,
      userId: contract.userId,
      name: contract.name,
      description: contract.description ?? null,
      status: contract.status,
      minValidMinutes: contract.terms.minValidMinutes,
      maxMissedCheckpoints: contract.terms.maxMissedCheckpoints,
      mandatoryArtifactTypesJson: JSON.stringify(contract.terms.mandatoryArtifactTypes),
      vivaPassingScore: contract.terms.vivaPassingScore,
      checkpointIntervalMinutes: contract.terms.checkpointIntervalMinutes ?? null,
      maxPauseMinutes: contract.terms.maxPauseMinutes ?? null,
      activeRangeStartsAt: new Date(contract.activeRange.startsAt),
      activeRangeEndsAt: new Date(contract.activeRange.endsAt),
      signedAt: contract.signedAt ? new Date(contract.signedAt) : null,
      activatedAt: contract.activatedAt ? new Date(contract.activatedAt) : null,
      endedAt: contract.endedAt ? new Date(contract.endedAt) : null,
      tagsJson: JSON.stringify(contract.tags),
      metadataJson: contract.metadata ? JSON.stringify(contract.metadata) : null,
      createdAt: new Date(contract.createdAt),
      updatedAt: new Date(contract.updatedAt)
    }
  });

  return { user, profile, contract };
}

export async function seedActiveSession(
  prisma: PrismaService,
  input: {
    sessionId?: string;
    userId?: string;
    profileId?: string;
    contractId: string;
    state?: string;
    validMinutes?: number;
    seedPassingViva?: boolean;
  }
) {
  const sessionId = input.sessionId ?? "session_fixture";
  const userId = input.userId ?? "user_fixture";
  const profileId = input.profileId ?? "profile_fixture";

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      profileId,
      contractId: input.contractId,
      title: "E2E session",
      objective: "Validate HTTP persistence.",
      state: input.state ?? "active_valid",
      plannedRangeStartsAt: new Date("2036-04-07T09:00:00.000Z"),
      plannedRangeEndsAt: new Date("2036-04-07T10:00:00.000Z"),
      startedAt: new Date("2036-04-07T09:00:00.000Z"),
      validMinutes: input.validMinutes ?? 55,
      invalidMinutes: 0,
      warningCount: 0,
      missedCheckpointCount: 0,
      finalArtifactRequired: true,
      createdAt: new Date("2036-04-07T08:55:00.000Z"),
      updatedAt: new Date("2036-04-07T09:55:00.000Z")
    }
  });

  if (input.seedPassingViva) {
    await prisma.vivaAttempt.create({
      data: {
        id: `${sessionId}_viva`,
        sessionId,
        status: "passed",
        score: 88,
        passingScore: 70,
        completedAt: new Date("2036-04-07T09:54:00.000Z"),
        createdAt: new Date("2036-04-07T09:50:00.000Z"),
        updatedAt: new Date("2036-04-07T09:54:00.000Z")
      }
    });
  }

  return sessionId;
}
