# Backend Prisma

Canonical Prisma ownership for MedStudy OS lives here.

Planned contents:

- `schema.prisma` as the source of truth for the backend database schema
- `migrations/` for committed Prisma migrations
- `seed.ts` for backend-owned deterministic seed entrypoints

Boundary rules:

- Prisma artifacts belong to the backend app, not `tools/`
- `packages/domain` stays persistence-agnostic
- `tools/db-migrations` and `tools/seed` are reserved for auxiliary scripts and operator documentation

Not implemented yet:

- No Prisma schema
- No generated Prisma client
- No migrations
- No backend seed implementation
