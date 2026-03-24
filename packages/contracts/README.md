# @medstudy/contracts

Shared API contracts, DTOs, and transport-safe schemas will live here.

Current scaffold directories:

- `src/schemas`
- `src/api`
- `src/events`
- `src/ai`
- `src/enums.ts`

`src/ai` is reserved for base shared AI input/output schemas that `@medstudy/ai-schemas` can extend with prompt-specific definitions.

Intentional colocation note:

- `Session`, `SessionBlock`, `SessionEvent`, and `SessionActorReference` are intentionally colocated in `src/schemas/session.ts`.
- They are treated as one tightly coupled session contract surface rather than split across separate files.

No application-specific endpoints or payload definitions are implemented yet.
