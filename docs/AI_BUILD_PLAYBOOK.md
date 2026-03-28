# MedStudy OS — AI Build Playbook

## Why this file exists

This file is the operational handoff for continuing the project across:
- new chats
- new computers
- new AI sessions
- different models

It should let an AI assistant quickly answer:
- what the project is
- what is already decided
- what is already built
- what the next bounded task is
- what must not be broken

## One-screen project summary

MedStudy OS is a contract-enforced study operating system for a medical student.

The product combines:
- rule-based session enforcement
- explicit anti-avoidance handling
- AI-assisted planning/evaluation
- desktop + mobile interfaces
- explainable scoring and contract outcomes

## Domain-core build path

Build and stabilize the project in this order:

1. M1 — domain entities & contracts
2. M2 — session state machine
3. M3 — scoring engine & hard-fail evaluator
4. M4 — contract validator & rule engine
5. M5 — anti-avoidance module

Only after this domain spine is stable should the project aggressively expand backend/app behavior.

## Current model responsibilities

### M2
Session lifecycle and transitions.

### M3
Weighted score, hard-fail evaluation, final scoring outcome.

### M4
Contract validation and rule compliance analysis.

### M5
Avoidance detection and recovery / behavior signals.

### Backend orchestration
The only layer allowed to compose M2 + M3 + M4 + M5 + persistence + timers + notifications.

## How to resume safely

When a new AI session starts:
1. read `PROJECT_CONTEXT.md`
2. read `ARCHITECTURE_DECISIONS.md`
3. read `BUILD_STATUS.md`
4. read `CLAUDE_HANDOFF.md` or `CODEX_ONBOARDING.md`
5. inspect the repo
6. identify current milestone
7. perform only the current bounded task

## Prompting discipline

### Use architect model for:
- milestone design
- architecture review
- implementation review
- semantic bug finding

### Use coding model for:
- bounded implementation
- patching
- tests
- focused refactors

## Milestone discipline

Never prompt for:
- “build the whole app”
- “implement all remaining milestones”
- broad cross-layer rewrites without necessity

Always prompt for:
- one milestone
- one patch
- one review
- one bounded refactor

## Review checklist

When reviewing milestone implementations, check:
- semantic correctness
- architecture boundary correctness
- purity of domain modules
- explainability
- test adequacy
- maintainability

## Safe next-step principle

Do not move to the next milestone until the current one is:
- implemented
- reviewed
- patched if needed
- stable enough not to infect downstream design

## Repository memory is more important than chat memory

The project should be resumable from repo docs plus code.
Do not rely on long chat history as the only source of truth.
