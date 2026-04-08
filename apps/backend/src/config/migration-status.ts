import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

type MigrationQueryable = {
  $queryRawUnsafe: <T = unknown>(query: string) => Promise<T>;
};

export function resolveMigrationsRoot() {
  return path.resolve(__dirname, "..", "..", "prisma", "migrations");
}

export function getExpectedMigrationCount() {
  const migrationsRoot = resolveMigrationsRoot();
  if (!existsSync(migrationsRoot)) {
    return 0;
  }

  return readdirSync(migrationsRoot, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory()
  ).length;
}

export async function getAppliedMigrationCount(prisma: MigrationQueryable) {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: number | bigint }>>(
      'SELECT COUNT(*) as count FROM "_prisma_migrations"'
    );
    const count = rows[0]?.count;
    return typeof count === "bigint" ? Number(count) : Number(count ?? 0);
  } catch {
    return 0;
  }
}
