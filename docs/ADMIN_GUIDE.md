# MedStudy OS Admin Guide

## Purpose

This guide explains how to operate MedStudy OS safely during pilot use and how to interpret session outcomes conservatively.

The system is designed to be explainable. The backend is the authority. The admin dashboard is a supervisory interface, not a second orchestration layer.

## Admin responsibilities

As admin or supervisor, you are responsible for:

- reviewing live and completed sessions
- interpreting outcomes from backend-owned evidence
- documenting any serious incident or manual action
- using admin actions conservatively and only when justified
- distinguishing technical/system failure from genuine study failure

## What the admin dashboard is for

The web admin dashboard is for:

- reviewing live sessions
- reviewing completed, partial, failed, excused, and penalized sessions
- inspecting timelines, scores, contract evaluation, and avoidance signals
- managing contracts within allowed states
- reviewing and handling penalties
- taking bounded admin actions through backend APIs

## What it must never be used for

Do not use the admin dashboard to:

- guess outcomes without checking the evidence
- override backend truth for convenience
- compensate for missing documentation by adding informal judgments
- use admin actions casually
- treat the dashboard as a hidden control panel for the student

Every serious action should be explainable after the fact.

## Logging in and accessing key areas

Typical operator flow:

1. Log in with the approved admin account.
2. Confirm you can access:
   - Live
   - Students
   - Sessions
   - Contracts
   - Penalties
3. Use session detail as the primary review surface.

## How to review live sessions

Use the Live page to monitor active and non-terminal sessions.

Check:

- student identity
- session title
- current session state
- valid minutes
- warning count
- missed checkpoints
- last heartbeat age or equivalent recency signal

If a session looks abnormal:

- open session detail immediately
- review timeline and warnings
- determine whether it looks like real misconduct, expected variance, or technical failure

## How to inspect a completed or failed session

Use session detail as the authoritative review surface.

Review in this order:

1. header and terminal state
2. timeline
3. scoring breakdown
4. contract evaluation
5. anti-avoidance signals
6. checkpoints
7. artifacts
8. penalties
9. any admin actions already taken

The question to answer is: why did this session end this way?

## How to read the session timeline

The timeline shows the sequence of backend-recorded events.

Use it to answer:

- when the session started
- whether warnings or pauses occurred
- whether checkpoints were completed or missed
- whether penalties or admin actions were recorded
- when review/finalization happened

If the timeline is incomplete, treat the session as needing caution before any irreversible action.

## How to read the scoring breakdown

The scoring breakdown is for explainability.

Use it to understand:

- total session score
- major component scores
- weighted effects
- whether the session failed because of a hard-fail condition or because of overall score

Do not recompute scores yourself. Use the backend-owned breakdown as displayed.

## How to read contract evaluation

Contract evaluation explains whether the session met the explicit contract terms.

Review:

- valid time requirement
- missed checkpoint thresholds
- mandatory artifact requirements
- viva expectations if applicable
- any hard-fail conditions

If contract evaluation and score appear to disagree, treat the session as needing deeper review before action.

## How to read anti-avoidance signals

Anti-avoidance signals are review inputs, not free-form accusations.

Use them to determine:

- whether warnings were justified
- whether escalation to review was reasonable
- whether the signal looks technical or behavioral

Do not treat a weak or isolated signal as proof of intentional misconduct.

## How to read artifacts

Check:

- whether required artifacts exist
- whether timestamps make sense
- whether the artifact content matches the session objective
- whether artifacts were submitted before review was finalized

Missing artifacts can be a genuine failure or a technical issue. Check the timeline before deciding.

## How to read checkpoints

Check:

- which checkpoints were due
- which were completed
- which were missed
- whether notes or evidence were attached when relevant

Repeated missed checkpoints are usually more meaningful than a single anomaly.

## How to read penalties

Check:

- penalty type
- reason
- status
- issued time
- resolving or revoking notes

Penalties should always be understandable from the underlying session evidence.

## How to create and edit contracts safely

Create and edit contracts conservatively.

Rules:

- use clear and explicit terms
- avoid ambiguous requirements
- prefer draft or otherwise editable states before rollout
- do not assume a contract is editable just because a field is visible
- review the contract with the student before first use

During pilot:

- change only one major contract variable at a time when possible
- avoid frequent contract churn because it makes comparison and trust harder

## Admin actions

Admin actions are powerful and must be documented.

### Excuse

Use when:

- the session was materially affected by a credible technical/system issue
- the student should not bear the outcome as recorded

Do not use just because the result is inconvenient.

### Penalize

Use when:

- the evidence supports penalty under the contract/policy
- backend evidence is sufficient and coherent

### Override outcome

Use only when:

- the recorded outcome is not acceptable as-is
- you have enough evidence to justify intervention
- the normal automated result should not stand

For pilot MVP, treat override conservatively and document why backend review needed intervention.

### Revoke penalty

Use when:

- the penalty was triggered in error
- later evidence shows the penalty should not stand

### Force review

Use when:

- the session needs explicit review handling
- automated progression is not sufficient
- technical or ambiguous conditions require human attention

## Mandatory notes and audit expectations

For every serious admin action:

- write a clear note
- describe why the action is justified
- reference the evidence used
- include whether the issue was technical, behavioral, or mixed

Good note pattern:

- what happened
- why the displayed result is not sufficient
- what evidence supports the action
- what follow-up is required

## How to distinguish real failure vs technical/system issue

Treat it as a likely technical/system issue when:

- desktop, mobile, and web admin disagree in ways that suggest sync failure
- telemetry drops coincide with app crash or connectivity loss
- required artifacts were attempted but not persisted
- timeline is incomplete or clearly inconsistent
- readiness, logs, or incident history show backend instability

Treat it as a likely real session failure when:

- timeline is coherent
- contract evaluation and scoring agree
- checkpoints or artifacts are genuinely missing
- warnings and penalties are consistent with the recorded evidence

When uncertain, prefer review and documentation over immediate punitive action.

## Escalation rules

Escalate to the operator immediately if:

- backend truth appears inconsistent
- audit trail is missing or contradictory
- repeated session corruption is suspected
- alerts indicate backend, DB, migration, or worker instability

Escalate to a full incident report if:

- outcome integrity may be affected
- a penalty may have been applied incorrectly
- an override or excuse is required because of technical failure

## What to do if backend, mobile, and desktop disagree

Priority order:

1. backend/session detail
2. desktop runtime state as context
3. mobile companion state as context

If they disagree:

- trust backend detail first
- check timeline and audit records
- check whether the disagreement is stale cache or sync delay
- do not take irreversible action until the discrepancy is understood

## What should be documented after every serious incident

Document:

- affected student
- affected session ID
- exact time window
- what the student saw
- what the admin saw
- what backend data showed
- whether scoring, outcome, or penalty may have been affected
- whether an admin action was used
- final resolution

Use the incident report template for anything non-trivial.

## Do

- use session detail as the main review page
- rely on backend-owned evidence
- document every serious admin action
- distinguish technical faults from genuine study failures
- escalate ambiguity rather than guessing

## Don't

- override outcomes casually
- penalize without clear evidence
- excuse sessions just to reduce friction
- trust a stale client view over backend detail
- use the dashboard as an informal backdoor around auditability
