# Database Unreachable

## Meaning

`/ready` is failing its database check.

## Likely causes

- invalid `DATABASE_URL`
- locked or missing SQLite file
- corrupted DB file or failed migration
- host disk permission issues

## Diagnostics

1. Inspect `/ready` output for database failure details.
2. Verify the configured database path or DSN.
3. Confirm the database file exists and the container can read/write it.
4. Check the most recent migration/deploy activity.

## Remediation

1. Restore the previous image if the issue began with a deploy.
2. Restore the DB file from backup if corruption is suspected.
3. Re-run migrations only after confirming schema state and backup safety.

## Escalation

Escalate immediately if data integrity is in doubt.
