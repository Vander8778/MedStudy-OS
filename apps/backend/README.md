# Backend App

NestJS backend entry point for MedStudy OS.

Allowed internal workspace dependencies:

- `@medstudy/domain`
- `@medstudy/contracts`
- `@medstudy/ai-schemas`

This is the only app allowed to import `@medstudy/domain`.

Canonical persistence scaffold location:

- `prisma/schema.prisma` for the future Prisma schema
- `prisma/migrations/` for committed Prisma migrations
- `prisma/seed.ts` for backend-owned seed entrypoints

Modules, controllers, persistence, queues, and runtime integrations are intentionally not implemented in this phase.
