---
title: "Boot eager-loads the autoload paths even when config.eagerLoad is false"
status: closed
updated: 2026-11-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "not a defect: RFC 0213 § 'Loading: everything at boot' rules that setup_main_autoloader eager loads whatever config.eager_load says (sync lookup, async load); trailties CLAUDE.md documents it. The trailmap failure is trailmap's files not defining their constants (trailmap-app-files-define-their-constants)."
---

## Context

Rails' `setup_main_autoloader` (railties/lib/rails/application/finisher.rb:17)
only calls `autoloader.setup`; eager loading is the separate `eager_load!`
initializer (:76), which runs only `if config.eager_load`.

trails' `setup_main_autoloader` (packages/trailties/src/application/finisher.ts:113)
ends `if (!this.config.deferBootEagerLoad) await autoloader.eagerLoad();` —
it eager-loads every autoload path on every boot, whatever `config.eagerLoad`
says.

## Found by

trailmap (story trailmap-audits-to-activestorage). Bumping its vendored trails
from 945a06ff5b to db76c59bbd (or to 8d2d2ae207, the #9663 merge) makes every
test file fail at boot, with `config.eagerLoad = false` in
config/environments/test.ts:

    Zeitwerk::NameError: expected file app/controllers/concerns/api-params.ts
    to define constant ApiParams, but didn't

## Acceptance

- Boot eager-loads only when `config.eagerLoad` is true, from an `eagerLoad!`
  initializer placed as Rails places it; `setup_main_autoloader` stops calling
  `eagerLoad()`.
- `deferBootEagerLoad` is retired or reduced to what `zeitwerk:check` needs.
- A trailties test boots an app with `eagerLoad = false` and a file in an
  autoload path that defines no constant, and boot succeeds.
