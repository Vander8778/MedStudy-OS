# MedStudy OS — Build Status

## Overall status

This file tracks milestone progress and current implementation focus.

## Milestone map

### M1 — Domain Entities & Contracts
Status: **implemented / reviewed**
Scope:
- canonical domain entities
- enums / status types
- shared contracts
- foundational schemas

Notes:
- keep canonical session states centralized
- avoid drift between domain types and contracts

### M2 — Session State Machine
Status: **implemented / reviewed / patched**
Scope:
- explicit transition map
- guards
- pure transition function
- domain events
- tests

Important notes from review:
- distinguish `isTerminalState` from `isOutcomeDecided`
- transition logic should update deterministic session fields where appropriate
- warning recovery should emit semantically correct domain events
- pause guard must respect pause budget
- machine-only events vs shared event contracts must be explicit

### M3 — Scoring Engine & Hard-Fail Evaluator
Status: **implemented / reviewed / patched**
Scope:
- hard-fail evaluator
- weighted scorer
- decision resolver
- explainable scoring result
- tests

Important notes:
- hard fail overrides outcome
- score is still computed for explainability
- weighted score handles missing components via redistribution
- final score rounded to 2 decimals before threshold comparison
- M3 receives evaluated inputs; it does not produce them

### M4 — Contract Validator & Rule Engine
Status: **design approved**
Scope:
- contract validation
- rule evaluation
- critical vs non-critical violations
- explainable contract evaluation result
- tests

Approved design notes:
- M4 is the contract interpretation layer
- M4 does not call M2 or M3
- M4 runs before M3 in orchestration flow
- flat explicit rule list is preferred over a generic DSL
- M4 should compute contract-level critical violation results
- orchestration later combines M4 and future anti-avoidance outputs when assembling M3 inputs

### M5 — Anti-Avoidance Module
Status: **not implemented yet**
Scope (planned):
- avoidance signal modeling
- policy decisions
- recovery recommendations
- typed outputs for orchestration

### M6+ — Backend, telemetry, apps, AI runtime, gamification
Status: **not yet active**
These milestones should only proceed after the core domain path is stable enough.

## Current likely next step

Primary next step:
- implement M4 in `packages/domain/src/contracts`
- then review and patch M4
- then begin M5 design

## Current priorities

1. keep domain layers pure
2. avoid cross-module semantic drift
3. finish the domain-core path before expanding UI/backend scope too far

## Definition of “safe to proceed”

A milestone is safe to proceed from when:
- implementation exists
- it has been reviewed
- patch issues have been resolved
- core tests are in place
- no major architectural leakage is found

## Known non-negotiables

- AI must not decide final pass/fail
- UI must not contain scoring / contract / state-machine logic
- core decision modules must remain deterministic and explainable
