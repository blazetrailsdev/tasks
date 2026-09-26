---
title: "Seat Engine.calledFrom as Engine.inherited does (engine.rb:361-370)"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Engine.calledFrom` (`packages/trailties/src/engine.ts:41-44`) is a plain
accessor that nothing in trails ever writes outside tests. Rails seats it in
`Engine.inherited` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:361-370`)
from the subclass's `caller_locations`, and `Application.inherited`
(`railties/lib/rails/application.rb:71-77`) runs `find_root(base.called_from)`.
Because trails never seats it, `Engine#root` (`engine.ts:101-108`) calls
`findRoot(undefined)`, and `Application.findRoot` (`application.ts:76-79`)
falls back to cwd. So an app booted from any other directory (vitest at the
repo root, as in `boot-app-test-help.trails.test.ts`) resolves the wrong root
unless the caller runs `config.setRoot`.

JS has no `inherited` hook (CLAUDE.md § "`inherited` is deferred"), but
`Application.register(klass)` / `Trailtie.register` is called from the
subclass's own module, which is where the caller location is.

## Converged shape

`register` (or the generated `config/application.ts`) seats `calledFrom` from
the defining module's location, e.g. an `import.meta.url` argument the generator
emits, so `findRoot(calledFrom)` walks up from the app's `config/`
directory as Rails does.

## Acceptance criteria

- A generated app's `Application` resolves `root` from its own directory with
  no `setRoot` call, whatever the cwd.
- `boot-app-test-help.trails.test.ts` drops `Trails.application!.config.setRoot(root)`.
