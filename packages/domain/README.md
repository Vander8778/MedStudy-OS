# @medstudy/domain

Pure TypeScript domain services, state machines, scoring, and contract enforcement logic will live here.

Current scaffold directories:

- `src/entities`
- `src/state-machines`
- `src/value-objects`
- `src/scoring`
- `src/contracts`
- `src/anti-avoidance`
- `src/gamification`

Test location rule:

- Domain tests should be colocated with the code they cover.
- Use `__tests__/` directories next to each domain area, for example `src/scoring/__tests__/` and `src/state-machines/__tests__/`.
- Prefer this over a single top-level test folder so scoring, state-machine, and contract-rule tests stay attached to their owning modules.

This package is intentionally limited to named domain boundaries and empty barrel exports until the domain model is implemented.
