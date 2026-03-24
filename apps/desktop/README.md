# Desktop App

Tauri + React shell for the MedStudy OS desktop monitoring app.

This scaffold now includes a minimal `src-tauri/` Rust shell wired to the Vite frontend.

Allowed internal workspace dependencies:

- `@medstudy/contracts`
- `@medstudy/ui-kit`

This app must never import `@medstudy/domain` directly.

Native monitoring integration, anti-avoidance handling, and validation workflows are intentionally deferred.
