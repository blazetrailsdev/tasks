---
title: "autoload-lib-drops-its-ignore-kwarg"
status: claimed
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: "2026-09-25T02:09:41Z"
assignee: "converge-config-target-version-to-two-arms"
blocked-by: null
closed-reason: null
---

## Context

`Configuration#autoloadLib` (`packages/trailties/src/application/configuration.ts:384-389`)
destructures `{ ignore }` and never reads it: the body only pushes `lib` onto
`autoloadPaths` and `eagerLoadPaths`.

Rails' `autoload_lib(ignore:)`
(`vendor/rails/railties/lib/rails/application/configuration.rb:471-481`) does the
same two pushes, then computes
`ignored_abspaths = Array.wrap(ignore).map { lib.join(_1) }` (`:479`) and hands
them to `Rails.autoloaders.main.ignore(ignored_abspaths)` (`:480`), so those
subtrees of `lib` are neither autoloaded nor eager-loaded (e.g. the generated
`config.autoload_lib(ignore: %w[assets tasks])`).

CLAUDE.md § "Trails has no autoloader" ratifies that there is no Zeitwerk
receiver, but the `ignore` kwarg still has an observable meaning — those paths
must be excluded from trails' eager directory scan — and the `Array.wrap(ignore)
.map { lib.join(_1) }` computation has a direct port.

## Acceptance criteria

- `autoloadLib` computes `ignoredAbspaths` exactly as `:479` does (Array.wrap,
  joined under `lib`) and records them where trails' eager-load scan consults
  them, so an ignored subtree of `lib` is not eager-loaded.
- The `Rails.autoloaders.main.ignore` call carries
  `@missingRailsCall ignore — PERMANENT` citing § "Trails has no autoloader".
- A test covers a string and an array `ignore`.
