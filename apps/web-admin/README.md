# Web Admin App

Next.js admin surface for operations, configuration, and review tooling.

The app router now lives under `src/app` to keep feature growth contained from the start.

Allowed internal workspace dependencies:

- `@medstudy/contracts`
- `@medstudy/ui-kit`

This app must never import `@medstudy/domain` directly.

No admin workflows, dashboards, or review actions are implemented yet.
