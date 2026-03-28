# MedStudy OS — Project Context

## What this project is

MedStudy OS is a contract-enforced study operating system for a medical student.

The product exists to solve two linked problems:

1. study rules must be enforced automatically and objectively
2. avoidance / procrastination must be detected early and handled explicitly

This is **not** a generic productivity app and **not** just an AI tutor.  
It is a rule-driven study enforcement system with AI-assisted planning, evaluation, and recovery flows.

## Product shape

The intended product consists of:

- a desktop monitoring app
- a mobile companion app
- a backend API
- a pure domain core
- an AI service
- a contract / rule engine
- a gamification layer
- a supervisor / admin view

## Core product principles

1. Only valid study time counts.
2. Final pass/fail decisions must remain rule-based and explainable.
3. Avoidance behavior is a first-class product scenario.
4. AI assists, but AI does not become the final authority for session outcomes.
5. Core business logic must live in pure domain/services, not in UI.
6. Shared types/contracts must be centralized.
7. State transitions must remain explicit and deterministic.
8. Structured AI outputs must be schema-validated.
9. Do not simplify the domain model unless explicitly instructed.
10. Prefer maintainable, explicit design over clever abstractions.

## Core domain concepts

Important entities and concepts:

- User
- Profile
- Contract
- Session
- SessionBlock
- SessionEvent
- TelemetryEvent
- Checkpoint
- Artifact
- Evaluation
- VivaAttempt
- Penalty
- Avatar
- AvatarUnlock
- MasteryTrack
- Notification
- PromptTemplate

## Canonical session states

These states are canonical unless intentionally revised in code and docs:

- planned
- arming
- armed
- active_valid
- active_warning
- paused_valid
- paused_expired
- invalid_block
- review_pending
- completed
- partial
- failed
- penalized
- excused

Important semantic distinction:

- a state can be non-terminal for transition purposes
- but still represent a decided study outcome

The codebase may expose separate helpers such as:

- `isTerminalState`
- `isOutcomeDecided`

## Scoring model

Weighted session score:

```text
session_score =
  0.35 * valid_time_score +
  0.20 * process_score +
  0.25 * artifact_score +
  0.20 * knowledge_score
```

Decision thresholds:

- 85–100 => completed
- 65–84 => partial
- 0–64 => failed

Hard fail if any apply:

- valid_minutes < contract.min_valid_minutes
- required final artifact is missing
- missed_checkpoints > contract.max_missed_checkpoints
- viva score below threshold
- critical contract violation exists

Important:

- hard fail overrides the outcome
- weighted score should still be computed for explainability
- scoring must remain deterministic

## What the system should feel like

MedStudy OS should feel like an **execution system with objective crediting**, not a motivational toy.

Desired qualities:

- transparent
- explainable
- academically serious
- minimal but strong
- anti-avoidance by design
- supportive without becoming fuzzy or subjective

## What this project should avoid

Do not turn MedStudy OS into:

- a generic habit tracker
- an LMS clone
- a social app
- an AI chat wrapper with vague productivity features
- a giant monolith where domain logic leaks into app code
