# Telemetry Backlog

## Meaning

Telemetry queue depth remains elevated for an extended period.

## Likely causes

- backend under-provisioned
- telemetry worker stalled or repeatedly retrying
- sudden client burst or abuse case

## Diagnostics

1. Check `telemetry_queue_depth` trend and processing counters.
2. Inspect recent telemetry worker logs for failures.
3. Verify DB health and write latency.

## Remediation

1. Restore worker processing first.
2. Reduce client ingress only if operationally necessary.
3. Confirm backlog drains after recovery.

## Escalation

Escalate if backlog growth threatens session review timeliness.
