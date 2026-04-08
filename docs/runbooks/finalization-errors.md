# Finalization Errors

## Meaning

`session_finalization_errors_total` is increasing.

## Likely causes

- scoring failure
- invalid transition due to stale/repeated actions
- audit persistence failure inside review flow

## Diagnostics

1. Inspect backend logs around `session_review_finalized` absence and thrown exceptions.
2. Check affected session state in admin detail.
3. Confirm contract evaluation and scoring inputs are present.

## Remediation

1. Fix the underlying exception path.
2. Re-run supported review actions for affected sessions.
3. Verify finalization counters resume normal behavior.

## Escalation

Escalate if errors affect multiple sessions or block terminal outcomes.
