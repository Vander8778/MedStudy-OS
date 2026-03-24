# Seed

Seed strategy: Prisma-backed deterministic seed scripts once the backend data model exists.

Principles for seeding:

- Seed data is for local development, test environments, and demo baselines only.
- Seeds must be deterministic and safe to rerun.
- Seed scripts should create only infrastructure and fixture data that supports development workflows.
- Contract scoring, session outcomes, and other business behaviors must still be exercised through domain/backend code, not hardcoded in seed scripts.

Planned ownership:

- The canonical seed entrypoint will live at `apps/backend/prisma/seed.ts`.
- This `tools/seed` folder is reserved for auxiliary seed helpers, operator scripts, and documentation.
- Documentation in this directory should explain available seed datasets, intended environments, and reset expectations.

Not implemented yet:

- No seed runner
- No fixture datasets
- No environment-specific seed commands
