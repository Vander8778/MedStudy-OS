# MedStudy OS M14 Manual Test Checklist

This checklist is for cross-module validation after automated integration/E2E suites pass.
It is intentionally explainability-first and should be completed against a staging or local
environment that includes the backend, desktop app, mobile companion, and web admin dashboard.

## 1. Session lifecycle sanity

- Create a new session from the backend-supported flow and verify the observed state path matches expectations.
- Confirm `planned -> arming -> armed -> active_valid` appears consistently in desktop and admin surfaces.
- Complete a healthy session and verify the final state, score, and contract evaluation all agree.
- Trigger a known failing session and verify the failure reason is readable in both admin detail and backend responses.

## 2. Desktop runtime validation

- Start an active session in the desktop app and verify poll cadence remains stable instead of hammering the backend.
- Confirm warning and pause transitions appear in the desktop shell without local authority drift.
- Submit an artifact after a terminal session and verify it is recorded without reopening the session.
- Restart the desktop app during an in-progress session and verify persisted session context restores correctly.

## 3. Telemetry and anti-avoidance

- Run a normal study session and confirm telemetry uploads succeed without queue warnings.
- Simulate non-study context exposure and verify anti-avoidance warning or escalation appears through backend orchestration.
- Replay a duplicate telemetry batch and verify duplicates are rejected without crashing ingestion.
- Explore abuse cases such as long idle stretches, repeated warning cycles, and non-study window switching.

## 4. AI failure handling

- Trigger an AI-backed flow with a valid mocked or staging provider response and verify the structured output is accepted.
- Trigger malformed AI output and verify schema validation blocks it from becoming authoritative.
- Trigger provider timeout/retry behavior and verify the user-facing flow fails safely without backend crash.
- Confirm any fallback or dependency-warning messaging remains explicit rather than silently fabricating results.

## 5. Web admin explainability

- Open session detail for a healthy completed session and verify the page answers “why did this session end this way?”
- Open session detail for a failed session and verify score breakdown, contract evaluation, events, and penalties are readable.
- Confirm admin action dialogs require confirmation and notes where expected.
- Confirm the live monitor and list pages render current backend state without optimistic mutations.

## 6. Mobile companion sanity

- Verify current session and latest result views refresh correctly after backend state changes.
- Verify offline read fallback shows cached data with stale warnings when appropriate.
- Queue a safe offline action, reconnect, and verify replay status is surfaced honestly.
- Confirm viva remains connectivity-required and is never queued offline.

## 7. Boundary and hardening checks

- Attempt invalid API payloads and verify structured `validation.invalid_input` responses.
- Attempt stale or repeated lifecycle actions and verify conflict handling is deterministic.
- Verify no client app computes local scoring or overrides backend truth after refresh.
- Verify contract edits, admin actions, and session review outcomes remain backend-authoritative.

## 8. Sign-off

- Record the environment, build identifiers, tester, date, and outcome in `docs/M14_MANUAL_TEST_RESULTS.md`.
- Capture regressions with exact repro steps, affected module(s), and blocking/non-blocking severity.
