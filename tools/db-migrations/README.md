# DB Migrations

Chosen ORM: Prisma.

Why Prisma for this repository:

- Type-safe schema and client generation align well with the TypeScript monorepo.
- It keeps migration ownership explicit without pushing persistence logic into UI apps.
- It fits a NestJS backend while still allowing the domain package to remain persistence-agnostic.

Migration strategy:

- The canonical Prisma schema location is `apps/backend/prisma/schema.prisma`.
- Canonical Prisma migration files belong in `apps/backend/prisma/migrations/`.
- Migration files will be created and reviewed as code, then committed to the repository.
- Production and staging environments should only apply committed migrations, never ad hoc schema changes.
- Domain rules remain in `packages/domain`; database models and adapters stay in backend-owned infrastructure code.
- This `tools/db-migrations` folder is reserved for auxiliary migration utilities, data backfills, process notes, and operator documentation.

Not implemented yet:

- No Prisma schema
- No migration files
- No database client
- No ORM integration inside NestJS
