# Auth Anomalies

## Meaning

The system is seeing repeated unauthorized or forbidden requests from the same source.

## Likely causes

- broken client token handling
- misconfigured health-deep token usage
- credential stuffing or accidental misuse

## Diagnostics

1. Check request logs grouped by source IP or request pattern.
2. Identify whether failures are on product auth or ops-only endpoints.
3. Verify recent client or secret rotation changes.

## Remediation

1. Rotate compromised tokens or secrets.
2. Fix client config if the issue is accidental.
3. Restrict or block abusive sources at the proxy if needed.

## Escalation

Escalate immediately if the pattern suggests active abuse.
