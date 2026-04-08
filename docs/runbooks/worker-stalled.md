# Worker Stalled

## Meaning

Telemetry processing has stopped making progress while work remains queued or registered.

## Likely causes

- in-process scheduler stopped ticking
- backend stuck on dependency failures
- repeated worker exceptions

## Diagnostics

1. Check `telemetry_queue_depth` and `telemetry_events_processed_total`.
2. Inspect backend logs for `telemetry_analysis_processed` gaps or repeated errors.
3. Confirm active sessions are still registered for analysis.

## Remediation

1. Restart the backend process if the scheduler is wedged.
2. Fix the underlying telemetry or DB error before allowing backlog to build again.
3. Watch queue depth return to baseline after restart.

## Escalation

Escalate if the backlog continues growing for more than 15 minutes.
