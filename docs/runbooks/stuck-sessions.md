# Stuck Sessions

## Meaning

Sessions are remaining in `review_pending` longer than the configured threshold.

## Likely causes

- finalization path throwing
- review timer or manual review flow not completing
- data preconditions missing on repeated attempts

## Diagnostics

1. Check `sessions_stuck_review_pending`.
2. Inspect logs for `session_review_finalized` absence and finalization errors.
3. Review the affected session detail in the admin dashboard and backend audit data.

## Remediation

1. Fix the failing dependency or scoring/evaluation precondition.
2. Re-run review through the supported backend/admin path once safe.
3. Verify the session exits `review_pending`.

## Escalation

Escalate if multiple sessions are stuck or if finalization errors are ongoing.
