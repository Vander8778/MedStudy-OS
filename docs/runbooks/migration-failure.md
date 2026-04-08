# Migration Failure

## Meaning

Migration parity or deploy-time migration execution failed.

## Likely causes

- incompatible migration SQL
- concurrent deploys
- damaged migration history table
- DB permissions issue

## Diagnostics

1. Check deploy logs for the exact migration command failure.
2. Compare applied migration count with files in `apps/backend/prisma/migrations/`.
3. Inspect `_prisma_migrations` in the target DB.

## Remediation

1. Stop further deploys.
2. Roll back the application image if the old code is still schema-compatible.
3. Create a forward corrective migration instead of attempting a manual destructive rollback.

## Escalation

Escalate if production schema drift is detected.
