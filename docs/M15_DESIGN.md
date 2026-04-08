# MedStudy OS M15 Design

M15 is implemented as an operational layer around the existing app modules. It adds:

- validated backend environment config in [`apps/backend/src/config/env.ts`](/C:/Users/drago/OneDrive/Документы/MedStudy-OS/MedStudy-OS/apps/backend/src/config/env.ts)
- liveness, readiness, and deep-health endpoints in [`apps/backend/src/health`](/C:/Users/drago/OneDrive/Документы/MedStudy-OS/MedStudy-OS/apps/backend/src/health)
- request correlation, structured logging hooks, and Prometheus metrics in [`apps/backend/src/observability`](/C:/Users/drago/OneDrive/Документы/MedStudy-OS/MedStudy-OS/apps/backend/src/observability)
- backend and web-admin container builds
- local compose orchestration
- CI plus staged deployment workflows
- operator runbooks

## MVP assumptions

- Hosting target: generic Docker hosts reachable over SSH, with images published to GHCR.
- Auth state: backend auth is still the current stub implementation, so `/health/deep` is protected by an ops token instead of product-role auth.
- Object storage: local MinIO for development, S3-compatible configuration shape for non-local environments.
- Database: the current backend remains SQLite-backed because the existing Prisma schema is SQLite today. M15 does not migrate runtime persistence to Postgres.
- Production startup requires `HEALTH_DEEP_TOKEN`; deep health must not be exposed anonymously.

## Health model

- `/health` is process-only liveness.
- `/ready` checks database reachability, Redis reachability when configured, and migration count parity.
- `/health/deep` adds operator-facing dependency detail for object storage and AI provider configuration.

Non-compose local backend runs still fail open on Redis if `REDIS_URL` is absent in
non-production mode. That keeps direct local boot lightweight, but it also means
`/ready` is not a guarantee that Redis-backed features are usable unless Redis is configured.

## Observability model

- Request IDs are assigned in middleware and propagated through AsyncLocalStorage.
- Structured logs are emitted through the custom JSON logger when the Nest app boots normally.
- Metrics are exposed at `/metrics` in Prometheus format.
- Session, telemetry, and AI flows emit additional operational counters and contextual logs without changing domain behavior.

## Local runtime

`docker-compose.yml` starts:

- backend-migrate
- backend
- web-admin
- redis
- minio

The current local persistence target is a SQLite file volume mounted into the backend container.

## Deploy flow

- `ci.yml` runs install, typecheck, lint, test, build, docker build, and a migration verification step.
- `deploy-staging.yml` auto-runs on `main`.
- `deploy-production.yml` is manual.

Both deploy workflows assume:

- GHCR image publishing
- remote Docker Compose hosts
- SSH secrets configured in GitHub Actions

The backend image is a pruned `pnpm deploy` artifact, not a copy of the full
workspace. Prisma migrations are run as a one-shot deploy step before the
backend service is brought back up, rather than being embedded in the backend
container startup command. Remote deploys export explicit `BACKEND_IMAGE` and
`WEB_ADMIN_IMAGE` tags so the host compose file pulls and runs the exact images
that were built in CI, rather than relying on `build:` definitions alone.

Local non-compose development can use the committed `.env.example` as the starting
point for `.env.local`.

## Operational gaps left explicit

- Redis is wired for readiness/compose, but the current app still uses the in-process telemetry scheduler rather than BullMQ.
- Deep health performs passive AI configuration checks rather than active provider pings.
- Object storage health is a reachability check only; it does not verify bucket credentials.
- The deploy workflows are concrete for GHCR + SSH, but can be swapped once a final hosting platform is chosen.
- Prometheus alert rules now live in `ops/prometheus/alerts.yml`; wiring them into a real Alertmanager or hosted equivalent is still environment-specific.
- Backup and restore steps for the current SQLite MVP are documented in `docs/runbooks/backup-restore.md`.
