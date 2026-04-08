# AI Provider Degraded

## Meaning

AI request error rate is elevated or latency is consistently high.

## Likely causes

- provider outage or rate limit
- invalid credentials
- prompt/output retry loops increasing latency

## Diagnostics

1. Inspect `ai_requests_total` by status and `ai_request_duration_seconds`.
2. Review `ai_request_failed` logs and error types.
3. Confirm the provider key and model configuration.

## Remediation

1. Keep the backend running; AI failures should remain explicit and non-authoritative.
2. Fix credentials or provider config.
3. If the provider is degraded, defer non-critical AI-backed flows until recovery.

## Escalation

Escalate if AI-backed operational flows are blocked for more than 30 minutes.
