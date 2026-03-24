# MedStudy OS

Foundation scaffold for a contract-enforced study operating system for medical students.

This repository currently establishes the monorepo boundaries only:

- `apps/mobile` for the Expo + React Native companion app
- `apps/desktop` for the Tauri + React monitoring app
- `apps/web-admin` for the Next.js admin app
- `apps/backend` for the NestJS backend
  - canonical Prisma home: `apps/backend/prisma`
- `packages/domain` for pure business/domain logic
- `packages/contracts` for shared API and data contracts
- `packages/ai-schemas` for prompt templates and schema-validated AI payloads
- `packages/ui-kit` for shared UI primitives
- `docs` for project documentation
- `tools` for repository tooling

No product logic, rule enforcement, session scoring, telemetry flows, or AI runtime behavior is implemented yet.

Database ownership note:

- Canonical Prisma files belong under `apps/backend/prisma`
- `tools/db-migrations` and `tools/seed` are reserved for auxiliary scripts and documentation, not the primary Prisma schema location

## Internal Dependency Matrix

Allowed internal workspace dependencies:

- `@medstudy/contracts`: no `@medstudy/*` dependencies
- `@medstudy/domain`: may depend only on `@medstudy/contracts`
- `@medstudy/ai-schemas`: may depend only on `@medstudy/contracts`
- `@medstudy/ui-kit`: no `@medstudy/*` dependencies
- `@medstudy/backend`: may depend on `@medstudy/domain`, `@medstudy/contracts`, and `@medstudy/ai-schemas`
- `@medstudy/mobile`: may depend on `@medstudy/contracts` and `@medstudy/ui-kit`
- `@medstudy/desktop`: may depend on `@medstudy/contracts` and `@medstudy/ui-kit`
- `@medstudy/web-admin`: may depend on `@medstudy/contracts` and `@medstudy/ui-kit`

Critical boundary rule:

- Only the backend may import `@medstudy/domain`.
- Client apps consume domain behavior through API contracts, never by bundling domain logic directly.
