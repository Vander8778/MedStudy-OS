# MedStudy OS Pilot Setup

## Purpose

This document explains how to prepare, launch, and run the first MedStudy OS pilot with one real student.

The goal of the pilot is to validate that:

- the backend remains the single reliable authority for session truth
- the desktop app can monitor real study sessions without frequent operator intervention
- the mobile app can support checkpoints, artifacts, results, and progress without becoming authoritative
- the web admin dashboard can support safe supervision and incident handling
- auditability, explainability, and recovery procedures are strong enough for limited real use

## Pilot scope and limitations

This pilot is intentionally narrow.

- One real student only
- One supervisor/admin only
- One production-like backend environment
- Desktop app is the primary runtime companion during study
- Mobile app is companion-only
- Web admin is supervisor-only
- Backend remains the source of truth for all outcomes, penalties, and admin actions

Current pilot limitations:

- SQLite-backed MVP persistence may limit concurrency and operational flexibility
- Telemetry operations are designed for a small pilot, not for scale
- Admin actions are available but must be used conservatively and documented every time
- AI features are backend-only and schema-validated, but any AI-dependent path should still be treated as potentially degraded
- The pilot is not a substitute for human judgment when a technical fault is suspected

## Prerequisites

Before pilot setup, confirm:

- M1-M15 codebase is on the intended pilot release tag or commit
- backend tests pass on the release candidate
- deployment and rollback steps were exercised once in staging
- backup and restore were exercised once in staging
- the student has a supported desktop machine for the monitoring app
- the student has a supported mobile device for the companion app
- the supervisor has web admin access and knows how to use audit views
- the operator has access to deployment, logs, metrics, and backups

## Required environments and services

Minimum required services for pilot:

- backend API
- web admin
- SQLite database volume
- Redis
- object storage or MinIO-compatible artifact storage
- metrics endpoint and alert rules
- log collection from container stdout/stderr

Recommended environment layout:

- `staging` for final rehearsal and rollback testing
- `production` for the pilot student

Required operational endpoints:

- `GET /health`
- `GET /ready`
- `GET /health/deep`
- `GET /metrics`

## Required accounts and roles

Required human roles:

- Operator: deploys, monitors, handles incidents, owns backups and rollback
- Student: uses desktop and mobile apps during study
- Admin/Supervisor: uses web admin for oversight and controlled actions

Required system-level access:

- backend deployment access
- secret/config access
- object storage access
- web admin login
- desktop app installer access
- mobile app build/distribution access

## Backend deployment checklist

- Confirm release commit or image tag
- Confirm `.env` or runtime secrets match the intended pilot environment
- Confirm `HEALTH_DEEP_TOKEN` is set in production
- Confirm `DATABASE_URL`, `REDIS_URL`, and storage settings are correct
- Confirm backend image tag is the one intended for pilot
- Confirm one-shot migration step completes successfully before restart
- Confirm `/health` returns `200`
- Confirm `/ready` returns `200`
- Confirm `/metrics` is reachable from the monitoring path
- Confirm alerts are loaded from `ops/prometheus/alerts.yml`
- Confirm logs contain structured JSON with `timestamp`, `level`, `service`, and `requestId`

## Desktop app install checklist

- Install the approved pilot build on the student's primary study machine
- Confirm the desktop app launches and can reach the backend
- Confirm the student can log in
- Confirm session restore works after app restart
- Confirm telemetry capture starts only when an appropriate session is active
- Confirm offline banner or degraded-state indicators appear when connectivity is interrupted
- Confirm the desktop app version matches the pilot release

## Mobile app install checklist

- Install the approved pilot build on the student's phone
- Confirm login works
- Confirm the home screen loads session data from the backend
- Confirm checkpoints can be viewed
- Confirm artifact submission works
- Confirm result and progress views load
- Confirm push permission flow works if enabled for the pilot
- Confirm the mobile app is treated as companion-only, not as an authority for outcomes

## Web admin access checklist

- Confirm admin/supervisor can log in
- Confirm access to:
  - live sessions
  - student list
  - session detail
  - contracts
  - penalties
- Confirm session detail renders:
  - timeline
  - scoring breakdown
  - contract evaluation
  - anti-avoidance view
  - checkpoints
  - artifacts
  - penalties
  - admin actions
- Confirm admin actions require confirmation and notes where expected

## Configuration checklist

- `NODE_ENV` correct for environment
- `DATABASE_URL` points to the intended pilot database
- `REDIS_URL` points to the intended Redis instance
- `CORS_ORIGINS` includes web admin and approved client origins
- `HEALTH_DEEP_TOKEN` set and stored securely
- `ANTHROPIC_API_KEY` or other AI provider key set if AI paths are enabled
- `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` set correctly
- `REVIEW_PENDING_STUCK_MINUTES` set to the intended threshold
- alert routing configured to the pilot operator channel

## First contract setup

For the first student, create one conservative contract only.

Checklist:

- Define study objective clearly
- Set valid minimum minutes
- Set checkpoint expectations
- Set mandatory artifact requirements
- Set viva expectations only if the pilot genuinely needs them
- Keep penalties understandable and minimal
- Avoid aggressive thresholds for the first real session
- Save contract in an allowed editable state first
- Review contract with the student before first real use
- Confirm the student understands what produces completion, partial, failure, and penalties

## First test session setup

Before the first real session, run one supervised test session.

Checklist:

- Create a short contract-backed test session
- Arm and start from the desktop app
- Trigger at least one checkpoint
- Submit at least one artifact
- Confirm telemetry events arrive
- Confirm the session reaches review flow cleanly
- Confirm the result appears in mobile and web admin
- Confirm the audit trail is readable
- Record any confusing or unstable behavior before live use

## Telemetry, artifact, and checkpoint sanity checks

Before go-live, verify:

- telemetry events are accepted by backend ingestion
- telemetry processing updates the session as expected
- warnings surface in desktop and session detail when appropriate
- checkpoints appear when due
- checkpoint completion is reflected in backend truth
- artifact upload succeeds and appears in session detail
- post-terminal artifact rejection behaves correctly
- audit timeline records these actions

## Notification sanity checks

Verify for the student device:

- push permission request is understandable
- reminder notifications appear only if configured
- checkpoint reminders deep-link to the relevant mobile surface if supported
- result notifications do not arrive for the wrong session
- disabling notifications does not break core session logic

## Go-live checklist

- Release tag or commit approved
- Backend healthy and ready
- Alerts loaded and notification channel confirmed
- Backup snapshot taken before pilot start
- Student desktop app installed and verified
- Student mobile app installed and verified
- Admin dashboard verified
- Contract reviewed with student
- One supervised test session completed successfully
- Support contact path agreed with student
- Daily check-in routine scheduled

## Pilot support routine

During the pilot, the operator should:

- check health/readiness each morning
- review overnight alerts
- confirm there are no stuck `review_pending` sessions
- confirm backup completed
- confirm Redis and storage are reachable
- review serious warnings or penalties before the next study block

The supervisor/admin should:

- review each completed or failed session
- document every non-trivial admin action
- distinguish student failure from system failure before acting

## Daily operating checklist during pilot

- Confirm backend `/ready` is `200`
- Confirm alerts are quiet or understood
- Confirm no unresolved severe incident is open
- Confirm student can log in on desktop
- Confirm mobile companion sync is healthy
- Confirm any `review_pending` sessions are moving within expected time
- Confirm artifacts uploaded during the last day are present
- Confirm the previous day's outcomes were reviewed

## Before ending the pilot

- export a summary of completed, partial, failed, excused, and penalized sessions
- review incident reports and admin-action notes
- identify technical failure modes vs genuine study-enforcement outcomes
- review false positives from telemetry or anti-avoidance paths
- review student usability feedback
- review whether contracts were understandable and enforceable
- confirm backup and restore posture remained acceptable throughout the pilot

## Success criteria for the pilot

The pilot is considered successful if most of the following are true:

- the student can run sessions without daily operator intervention
- backend truth remains consistent across desktop, mobile, and web admin
- session outcomes are explainable from scoring, contract evaluation, and audit data
- incidents can be diagnosed from logs, metrics, and audit trail
- admin actions remain rare, documented, and justified
- no unresolved data-loss or outcome-integrity issue occurs

## Stop conditions and rollback conditions

Stop the pilot immediately if any of the following occurs:

- backend truth is no longer trustworthy for session outcomes
- repeated session corruption or unrecoverable audit gaps occur
- scoring or penalties are applied incorrectly and cannot be explained from backend data
- backup or restore process is found to be unreliable
- desktop monitoring fails frequently enough that sessions cannot be trusted

Rollback conditions:

- severe deployment regression after go-live
- migration mismatch after deploy
- repeated readiness failures
- artifact or telemetry loss affecting outcome integrity

Rollback actions:

- pause new real sessions
- redeploy previous known-good image
- confirm `/ready` and critical workflows
- restore data only if corruption or data loss is confirmed
- document the event in an incident report before resuming pilot activity
