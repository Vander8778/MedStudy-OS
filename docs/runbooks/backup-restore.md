# Backup And Restore

## Meaning

This runbook covers the MVP backup and restore path for the current SQLite-backed MedStudy OS deployment.

## Likely scenarios

- host disk loss or corruption
- accidental database deletion
- broken deploy that requires data rollback to a known-good snapshot

## Backup steps

1. Stop the backend service so the SQLite file is no longer being written.
2. Copy the active database file and its surrounding Prisma data directory to an off-host location.
3. Record the backup timestamp, deploy SHA, and host name alongside the copied files.
4. If artifact storage is local or MinIO-backed, export or sync that bucket snapshot at the same time.

## Restore steps

1. Stop backend and web-admin on the target host.
2. Restore the saved SQLite database file into the backend Prisma data path.
3. Restore the matching artifact bucket snapshot if artifacts are required for the incident.
4. Start the backend, confirm `/ready` is healthy, then start web-admin.
5. Verify recent sessions, artifacts, and `/metrics` before declaring recovery complete.

## Validation

- run one staging restore exercise before production sign-off
- confirm the restored service returns `200` from `/ready`
- confirm at least one known session and one known artifact are visible after restore

## Future note

When runtime persistence moves to Postgres, replace this runbook with provider-backed PITR and restore validation steps.
