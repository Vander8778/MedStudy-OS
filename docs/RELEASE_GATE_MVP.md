# MedStudy OS MVP Release Gate

## Purpose

This document defines the formal release gate for MVP pilot launch.

For MedStudy OS, "MVP ready" does not mean feature complete. It means the system is safe and explainable enough to run a tightly controlled pilot with one real student.

Backend truth, auditability, and operational recovery matter more than convenience.

## What MVP ready means

MVP ready means all of the following are true:

- backend remains the single source of truth
- session lifecycle is controlled through the backend state machine
- scoring and contract evaluation are explainable
- anti-avoidance signals are visible and auditable
- desktop app is usable as the primary runtime companion
- mobile app is usable as a non-authoritative companion
- web admin is usable for safe supervision and documented actions
- integration and E2E tests give reasonable confidence in cross-module behavior
- deployment, health, logging, metrics, alerts, and recovery procedures are in place

## Included in MVP

- backend API and orchestration
- session lifecycle state machine
- scoring engine
- contract rule engine
- anti-avoidance module
- AI service layer with schema validation
- gamification as downstream consequence only
- desktop monitoring app
- mobile companion app
- web admin dashboard
- integration testing and E2E hardening
- deployment, observability, and operational documentation

## Explicitly out of scope

- multi-tenant or institutional scale
- high-availability multi-region deployment
- real-time SSE or WebSocket sync
- full BI or analytics platform
- client-side authority for outcomes
- biometric or enterprise auth enhancements
- broad mobile or web feature expansion beyond current pilot use

## Required technical sign-off areas

- backend correctness
- session-state integrity
- scoring/explainability integrity
- anti-avoidance wiring integrity
- AI failure handling
- desktop runtime stability
- mobile companion correctness
- web admin action safety
- deployment and rollback readiness
- backup and restore readiness

## Required product and operational sign-off areas

- student workflow clarity
- admin workflow clarity
- contract clarity for first student
- pilot support process
- incident reporting readiness
- alerting and monitoring readiness
- known issues reviewed and accepted or blocked

## Release checklist

### Architecture freeze

- [ ] No unresolved architecture-level dispute remains for pilot
- [ ] Backend authority boundaries are unchanged
- [ ] No client app is allowed to become authoritative

### Critical tests passing

- [ ] Backend unit/integration/E2E suite passing on release candidate
- [ ] Desktop contract tests passing
- [ ] Mobile contract/compliance tests passing
- [ ] Web admin tests passing
- [ ] No known flaky critical-path test is ignored for release

### Deployment readiness

- [ ] Backend Docker image builds cleanly
- [ ] Web-admin Docker image builds cleanly
- [ ] One-shot migration flow validated
- [ ] Staging deploy validated
- [ ] Rollback path validated once

### Observability readiness

- [ ] `/health` and `/ready` behave correctly
- [ ] `/metrics` exposes the required metric set
- [ ] Logs contain `timestamp`, `level`, `service`, `requestId`
- [ ] Alert rules exist for critical operational failures
- [ ] Runbooks exist for the core alert set

### Admin workflow readiness

- [ ] Admin can inspect session detail end to end
- [ ] Admin can read scoring, contract evaluation, and anti-avoidance views
- [ ] Admin actions require confirmation
- [ ] Admin actions require notes where expected
- [ ] Admin guidance is written and reviewed

### Desktop readiness

- [ ] Desktop app can restore sessions after restart
- [ ] Desktop app reflects backend truth cleanly
- [ ] Telemetry capture and upload path verified
- [ ] Warning and degraded-state handling verified

### Mobile readiness

- [ ] Mobile login works
- [ ] Session, artifact, result, and progress screens work
- [ ] Offline-safe behavior is bounded and honest
- [ ] Mobile does not expose authoritative lifecycle control

### Data safety and backup posture

- [ ] Backup procedure documented
- [ ] Restore procedure documented
- [ ] One staging restore test completed
- [ ] Artifact storage handling is understood

### Incident handling readiness

- [ ] Incident report template exists
- [ ] Operator knows when to pause pilot activity
- [ ] Admin knows when to escalate rather than override

### Known issues review

- [ ] All known issues reviewed within the categories below
- [ ] All blockers are closed
- [ ] All acceptable pilot risks are explicitly accepted
- [ ] Remaining backlog is documented

## Issue classification

### Blocker

An issue is a blocker if it could:

- corrupt session truth
- make outcomes untrustworthy
- break auditability
- make rollback or recovery unreliable
- prevent the student from completing normal pilot sessions
- allow a client to behave authoritatively over backend truth

### Acceptable for pilot

An issue may be acceptable for pilot if:

- it does not threaten outcome integrity
- it has a known workaround
- it affects convenience more than trust
- it is documented and monitored

### Backlog

An issue belongs in backlog if:

- it is real but non-critical for one-student pilot use
- it does not materially weaken safety, explainability, or recoverability
- it is deferred intentionally

## Release decision

Choose one:

- [ ] GO
- [ ] GO WITH KNOWN RISKS
- [ ] NO-GO

## Decision notes

- Release decision rationale:
- Key known risks accepted:
- Key follow-up items required after launch:

## Sign-off table

| Area | Owner | Status | Notes |
|---|---|---|---|
| Backend |  |  |  |
| Desktop |  |  |  |
| Mobile |  |  |  |
| Web Admin |  |  |  |
| Integration Testing |  |  |  |
| Deployment/Ops |  |  |  |
| Pilot Operations |  |  |  |

## Version and date

- Release version:
- Release commit/tag:
- Decision date:

## Rollback conditions after pilot begins

Rollback or pilot pause is required if:

- backend truth becomes inconsistent
- session outcomes cannot be explained from backend records
- repeated deployment or migration failures occur
- artifact or telemetry loss affects outcome integrity
- admin actions are being used repeatedly to compensate for technical faults
- the student cannot reliably complete normal sessions because of system instability
