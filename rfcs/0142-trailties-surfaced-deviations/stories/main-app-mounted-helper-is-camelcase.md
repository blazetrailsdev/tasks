---
title: "main_app mounted helper is spelled mainApp"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Application::Finisher` defines the host's mounted helper with
`app.routes.define_mounted_helper(:main_app)`
(`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb:60-61`).
trails ports it as `defineMountedHelper("main_app")`
(`packages/trailties/lib/application/finisher.ts:131-132`), so an engine view or
controller reaches the host's routes through a snake_case `main_app` member.
Under CLAUDE.md § "Casing is translated, never mirrored", the code identifier is
`mainApp`, as the engine proxy for `blorgh` is reached by its engine name.

## Acceptance criteria

- [ ] The helper is defined and read as `mainApp`; the `":main_app"` railties-order token in `application.ts:248` is checked against the same rule.
- [ ] `engines.md` refers to `mainApp`.
