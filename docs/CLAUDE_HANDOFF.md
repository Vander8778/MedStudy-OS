# MedStudy OS — Claude Handoff

## Project summary

MedStudy OS is a contract-enforced study operating system for a medical student.

The product is designed around two main problems:

1. study rules must be enforced automatically and objectively
2. avoidance/procrastination must be detected and handled explicitly

This is not a generic productivity tool and not merely an AI tutor.
It is a rule-driven study enforcement system with AI-assisted planning/evaluation and companion interfaces.

## Fixed decisions

- monorepo with Turborepo + pnpm
- backend in NestJS
- pure domain logic in `packages/domain`
- shared schemas/contracts in `packages/contracts`
- AI schema/prompt package separate from rule logic
- UI packages/apps must not contain scoring, contract, or state-machine logic
- AI must not decide final pass/fail
- state transitions must remain explicit and deterministic
- domain modules must be testable in isolation

## Core domain spine

The backbone of the product is:

- M2 session state machine
- M3 scoring engine
- M4 contract validator / rule engine
- future M5 anti-avoidance module

These modules should remain pure and separate.
The backend/orchestration layer is the only place that should compose them together.

## Canonical session states

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

Important note:
There may be a distinction between “terminal for transition purposes” and “outcome already decided”.

## Scoring formula

```text
session_score =
  0.35 * valid_time_score +
  0.20 * process_score +
  0.25 * artifact_score +
  0.20 * knowledge_score
```

Thresholds:
- 85–100 => completed
- 65–84 => partial
- 0–64 => failed

Hard fail if:
- valid_minutes < contract.min_valid_minutes
- required final artifact missing
- missed_checkpoints > contract.max_missed_checkpoints
- viva below threshold
- critical contract violation exists

## Build status

- M1: done / reviewed
- M2: done / reviewed / patched
- M3: done / reviewed / patched
- M4: design approved, implementation next / in progress depending on repo state
- M5: not started yet

## Current focus

The likely current focus is:
- implement or review M4
- then patch M4 if needed
- then move to M5 design

## Claude instructions

When continuing this project:

1. do not redesign the whole system
2. respect existing architecture unless there is a real issue
3. work only within the current milestone
4. keep domain logic pure
5. do not move business logic into UI
6. do not let AI become decision authority
7. preserve project vocabulary and existing abstractions where reasonable
8. prefer bounded patches over broad rewrites

## What to do first in a fresh chat

1. inspect repository structure
2. inspect docs and current milestone status
3. summarize what appears already implemented
4. identify current likely next bounded step
5. wait for the concrete implementation or review request
