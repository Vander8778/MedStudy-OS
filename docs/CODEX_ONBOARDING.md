You are joining an existing project called MedStudy OS on a fresh machine with no prior conversation context.

Your job is to first understand the project deeply from the repository and this onboarding brief, then act as a bounded implementation engineer. Do not assume prior chat history exists. Treat this prompt as the authoritative starting context.

# Project identity

MedStudy OS is a contract-enforced study operating system for a medical student.

The system is designed to solve two core problems:
1. study rules must be enforced automatically and objectively
2. avoidance/procrastination must be detected early and handled explicitly

This is not a generic productivity app.
This is not just an AI tutor.
This is a rule-driven study enforcement system with AI-assisted planning/evaluation and companion interfaces.

# Product shape

The intended product consists of:
- a desktop monitoring app
- a mobile companion app
- a backend API
- a pure domain core
- an AI service
- a contract/rule engine
- a gamification layer
- a supervisor/admin view

# Non-negotiable architectural principles

1. Only valid study time counts.
Passive seated time or app-open time does not count automatically.

2. Final pass/fail decisions must remain rule-based and explainable.
AI may assist, but AI must not become the final authority for session outcomes.

3. Avoidance behavior is a first-class product concern.
It must be modeled explicitly, not treated as a side note.

4. Core business logic must live in pure domain/services, not in UI or transport layers.

5. Shared types/contracts must be centralized and reused across modules.

6. State transitions must remain explicit and deterministic.

7. The state machine, scoring engine, and contract logic are the backbone of the system and must not leak into frontend apps.

8. Structured AI outputs must be schema-validated.
Never trust free-form model output as domain truth.

9. Do not simplify or delete domain entities, states, or invariants unless explicitly instructed.

10. Prefer maintainable, explicit design over clever abstractions or framework magic.

# Core domain ideas

MedStudy OS treats a study session as a formal lifecycle with evidence, scoring, and outcome.

The system includes concepts such as:
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
- MasteryTrack
- Notification
- PromptTemplate

The session lifecycle is central to everything.

# Important session states

These states are important and should be treated as canonical unless the current codebase clearly and intentionally evolved them:

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
- a state can be non-terminal for transition purposes but still represent a decided study outcome
- keep an eye out for helpers like isTerminalState vs isOutcomeDecided

# Scoring model

The intended scoring model is:

session_score =
  0.35 * valid_time_score +
  0.20 * process_score +
  0.25 * artifact_score +
  0.20 * knowledge_score

Decision thresholds:
- 85–100 => completed
- 65–84 => partial
- 0–64 => failed

Hard fail if any of the following apply:
- valid_minutes < contract.min_valid_minutes
- required final artifact is missing
- missed_checkpoints > contract.max_missed_checkpoints
- viva score below threshold
- critical contract violation exists

Important:
- hard-fail overrides outcome
- weighted score should still be computed for explainability
- this logic must remain deterministic

# Intended architecture

The preferred architecture is:

- monorepo
- shared pure domain package
- shared contracts/schemas package
- backend service
- AI service / prompt registry
- desktop app
- mobile app
- optional admin/web app

Typical boundaries:
- domain = pure TypeScript business logic
- contracts = shared schemas and API/data contracts
- AI schemas/prompts = structured AI input/output definitions
- apps = UI and transport layers only
- backend/orchestration = event handling, persistence, timers, wiring
- telemetry = classification/aggregation, but not final scoring logic
- scoring/state machine/contract engine = domain core

# Absolute do-not-do list

Do not:
- move scoring logic into UI
- move contract logic into UI
- move state transitions into UI
- make AI the final source of truth for pass/fail
- collapse multiple architectural layers into one giant file
- silently simplify the domain model
- invent broad refactors when a bounded patch is enough
- mix persistence concerns into pure domain modules
- add gamification rewards for meaningless actions like opening the app
- replace explicit transitions with vague implicit logic
- rewrite unrelated modules during a bounded task

# Expected engineering style

You should behave like a senior engineer joining an existing codebase.

When working:
1. First understand the repository as it exists now.
2. Infer current implementation status from code, docs, and tests.
3. Respect what is already implemented unless there is a real bug or architectural issue.
4. Make bounded changes only.
5. Prefer small explicit modules.
6. Preserve public contracts unless a real correction is needed.
7. Add tests for critical logic.
8. Keep pure layers pure.

# Current workflow expectations

You are not expected to design the whole product from scratch in each prompt.
This project is being built milestone by milestone.

That means:
- you may be asked to inspect and summarize first
- then implement only one bounded milestone
- then patch after review
- then move to the next milestone

You must not jump ahead and build future milestones unless explicitly asked.

# Your immediate onboarding task

Do not modify code yet.

First:
1. Inspect the repository structure.
2. Read the most important docs/config files if present.
3. Summarize the architecture that currently exists in code.
4. Identify which milestones appear already implemented.
5. Identify which major modules/packages exist and what each one is responsible for.
6. Identify architectural gaps, suspicious coupling, or incomplete areas.
7. Identify the current likely next milestone based on the repository state.
8. Call out anything that appears inconsistent with the intended architecture above.

# Output format

Respond with:

1. Project understanding summary
2. Current repository architecture
3. What appears already implemented
4. What appears incomplete or missing
5. Risks / inconsistencies / architectural drift
6. Best guess at the current milestone and the next bounded implementation step

Do not write code yet.
Do not propose a giant rewrite.
Do not make ungrounded assumptions when the repository can answer the question.
If something is unclear, say it is unclear and explain why.