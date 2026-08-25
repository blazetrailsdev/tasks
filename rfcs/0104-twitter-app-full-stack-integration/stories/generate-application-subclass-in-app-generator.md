---
title: "generate-application-subclass-in-app-generator"
status: closed
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of generate-app-subclassing-application, which predates it and covers the same app-generator template gap. Filed before I checked the RFC listing; the src/-prefixed-layout-vs-EngineConfiguration-paths half of my body is worth folding into that story."
---

## Context

`trails new` generates a `config/application` that is a plain object literal,
not a `Trailties.Application` subclass, so a generated app cannot boot through
the initializer chain even though `trails server` now does
(PR #6517).

- `packages/trailties/src/generators/app-generator.ts:334-349` —
  `createConfigFiles` writes `src/config/application.ts` as
  `export const app = { name, config: { database }, routes: drawRoutes }`.
- `packages/trailties/src/generators/app-generator.ts:351-357` —
  `src/config/environment.ts` re-exports that object; `config.ts` (line 248)
  does the same at the root.
- Rails' `config/application.rb` defines `class Application < Rails::Application`
  and gets registered via the `inherited` hook
  (`railties/lib/rails/application.rb:66-73`); trails' documented replacement
  is an explicit `Application.register(Subclass)` call
  (`packages/trailties/src/application.ts:register`, `trailtie.ts:3` — "no
  `inherited` hook, no automatic registration").
- `packages/trailties/src/commands/server.ts` imports
  `config/application` and then calls `Trails.initialize()`, which throws
  `"Trails.application is not set"` unless that import registered a subclass.
  It probes the `src/`-prefixed path as well as the Rails-layout root, so the
  file is found — it just does not register anything.
- Separately, the generated tree is `src/`-prefixed (`src/config/routes.ts`,
  `src/app/controllers`) while `EngineConfiguration`'s path set
  (`packages/trailties/src/engine/configuration.ts:66-90`) declares the Rails
  layout (`config/routes.ts`, `app/controllers`, `app/views`), so
  `add_routing_paths` / `add_view_paths` / `setup_main_autoloader` find
  nothing in a generated app.

## Acceptance criteria

- The generated `config/application.ts` defines an `Application` subclass and
  calls `Application.register(...)`, mirroring what Rails'
  `config/application.rb` gets from `inherited`.
- The generated tree uses the Rails layout the `paths` set declares, so
  `add_routing_paths`, `add_view_paths` and `setup_main_autoloader` resolve
  against it (or `EngineConfiguration`'s paths are converged onto whatever
  layout is chosen — one of the two must move).
- `trails new demo && cd demo && trails server` boots and serves a generated
  controller action; covered by a generator + boot test, not only the
  `app-generator` snapshot.
