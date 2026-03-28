# MedStudy OS — AI Build Playbook

## Purpose

This file explains how AI coding assistants should be used on this project.

Use this as a practical workflow guide for:

- Claude / Opus-style architect models
- Codex / code-first implementation models

## Tool roles

### Opus / Claude-style model
Use for:
- architecture
- milestone design
- reviewing implementations
- identifying semantic bugs
- checking boundaries between modules
- preventing architectural drift

### Codex / code-first model
Use for:
- bounded implementation
- patching
- writing tests
- scaffolding
- generating files
- focused refactors

## Core workflow

Use this rhythm:

1. **Design**
   - Ask Opus to design the next milestone or review the next bounded slice.

2. **Implement**
   - Ask Codex to implement only that bounded milestone.

3. **Review**
   - Ask Opus to review Codex’s output.

4. **Patch**
   - Ask Codex to patch only the review findings.

5. **Proceed**
   - Move to the next milestone only after the previous one is stable enough.

## Golden rule

Do not ask any model to “build the whole product”.

Always work milestone by milestone or patch by patch.

## What every implementation prompt should include

For bounded implementation prompts, include:

- current milestone
- architecture constraints
- what not to implement
- target directory/package
- required files
- required types / behavior
- test requirements
- output format

## What every review prompt should include

For review prompts, include:

- what milestone is being reviewed
- architecture constraints
- expected behavior
- specific things to verify
- request for high-priority and medium-priority issues
- question: “Safe to proceed?” if relevant

## Prompting rules

### Do
- constrain scope tightly
- say what layer is being worked on
- say what must remain out of scope
- ask for tests
- ask for explainability
- ask for strong typing
- ask for pure domain logic where relevant

### Do not
- ask for giant end-to-end generation
- allow unrelated rewrites
- blur domain and orchestration concerns
- let AI invent new architecture casually

## Project-specific non-negotiables

- only valid study time counts
- final pass/fail remains rule-based
- AI assists but does not decide
- core business logic stays in pure domain modules
- shared contracts stay centralized
- state transitions remain explicit
- avoid hidden coupling across apps/services/packages

## Milestone order

Recommended domain-first order:

- M1: domain entities & contracts
- M2: session state machine
- M3: scoring engine & hard-fail evaluator
- M4: contract validator & rule engine
- M5: anti-avoidance module

Only after the domain spine is sufficiently stable should broader backend/app expansion accelerate.

## Review philosophy

When reviewing generated code, prioritize:

1. semantic correctness
2. boundary correctness
3. determinism
4. explainability
5. test coverage
6. maintainability

## Patch philosophy

Patch prompts should ask for:
- focused changes only
- no whole-module rewrites unless truly necessary
- only changed files
- short summary of fixes before code

## Repository onboarding for fresh AI

When onboarding a fresh AI model:
1. give it `PROJECT_CONTEXT.md`
2. give it `ARCHITECTURE_DECISIONS.md`
3. give it `BUILD_STATUS.md`
4. give it the current bounded task
5. tell it not to modify code yet if you want inspection first

## Practical discipline

Keep a simple engineering log:
- what prompt was used
- with which model
- what was implemented
- what review found
- what patch was applied

That makes it much easier to resume on another machine or in a fresh chat.
