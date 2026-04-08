# High Error Rate

## Meaning

HTTP 5xx rate is above the operational threshold.

## Likely causes

- broken deploy
- downstream dependency failures
- request shape drift from clients

## Diagnostics

1. Check `http_requests_total` by status and route.
2. Inspect structured logs by `requestId` for a representative failing request.
3. Confirm `/ready` state and recent deploy activity.

## Remediation

1. Roll back if the issue started with a deploy.
2. Fix the failing route or dependency.
3. Confirm p95 latency and 5xx rate return to baseline.

## Escalation

Escalate if public or admin mutation routes are affected broadly.
