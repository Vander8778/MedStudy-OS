# MedStudy OS — Architecture Decisions

## Fixed architectural choices

### 1. Monorepo
Use a monorepo with:

- Turborepo
- pnpm workspaces

Reason:
The project includes multiple apps and shared packages. Shared domain logic and contracts must remain centralized.

## 2. Backend
Use **NestJS**, not FastAPI.

Reason:
The rest of the stack is TypeScript-centric. NestJS lets the backend consume the same domain packages and shared contracts directly, reducing model drift.

## 3. Domain core
Core business logic must live in `packages/domain` as pure TypeScript.

Reason:
The following must remain framework-free and testable:

- session state machine
- scoring engine
- contract validator / rule engine
- anti-avoidance domain logic
- gamification logic

No database, HTTP, UI, or framework coupling in this layer.

## 4. Shared schemas/contracts
Shared types, Zod schemas, and API/data contracts must live in `packages/contracts`.

Reason:
All consumers must use the same canonical shapes:

- backend
- mobile
- desktop
- AI service
- future admin interfaces

## 5. AI schema/prompt package
Prompt templates and structured AI input/output schemas should remain separate from business logic.

Preferred package:
- `packages/ai-schemas`

Reason:
AI prompt structure and AI JSON schemas are not the same thing as rule-based domain logic.

## 6. UI package
Shared UI primitives should live in `packages/ui-kit`.

Reason:
UI reuse is useful, but UI must remain free of business logic.

## 7. Backend-only AI access
Clients must never call LLMs directly for authoritative system behavior.

Reason:
- schema validation must be centralized
- prompt handling must be controlled
- decision authority must remain server-side and rule-based

## 8. Backend as orchestration layer
The backend is the composition layer that wires together:

- M2 state machine
- M3 scoring engine
- M4 contract/rule engine
- future M5 anti-avoidance logic
- persistence
- timers
- telemetry ingestion
- notifications

The backend is the only place that should coordinate these subsystems.

## 9. State machine
The session lifecycle must be represented as an explicit state machine.

Reason:
State transitions are central to the project. They must stay deterministic, testable, and auditable.

## 10. Deterministic rule decisions
Final session outcome must remain explainable and deterministic.

Reason:
The product promise depends on objective enforcement. AI may inform inputs, but not replace final rule-based decisions.

## 11. AI boundary
AI may help with:

- planning
- anti-avoidance micro-actions
- checkpoint generation
- artifact evaluation
- viva / recall evaluation
- summaries

AI must not directly decide:

- final pass/fail
- final penalty application
- authoritative contract outcome

## 12. Avoidance is explicit domain behavior
Avoidance is not just “bad UX” or “low engagement”.
It is a modeled product scenario with explicit handling.

## 13. No hidden coupling
Avoid hidden coupling across:

- mobile
- desktop
- backend
- AI service
- domain modules

Each layer should have explicit boundaries.

## Suggested repository shape

```text
packages/
  domain/
  contracts/
  ai-schemas/
  ui-kit/

apps/
  mobile/
  desktop/
  web-admin/
  backend/
```

## Architectural anti-patterns to avoid

Do not:

- move scoring into frontend apps
- move contract logic into frontend apps
- move session transitions into frontend apps
- make AI the final source of truth
- collapse core layers into one file
- mix persistence concerns into pure domain modules
- build a generic rules DSL too early
