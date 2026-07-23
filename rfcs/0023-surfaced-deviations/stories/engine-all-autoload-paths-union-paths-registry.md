---
title: "Engine::Configuration all_autoload(_once)_paths: union paths registry like Rails"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5105 converged `Engine::Configuration#all_eager_load_paths` to union
`paths.eager_load` (added eager_load flag machinery to
packages/trailties/src/paths.ts and marked the default `app*` paths). The
sibling accessors still have the same gap:

- Rails `all_autoload_paths` = `autoload_paths + paths.autoload_paths`
  (vendor/rails/railties/lib/rails/engine/configuration.rb:123-125) and
  `all_autoload_once_paths` = `autoload_once_paths + paths.autoload_once`
  (configuration.rb:127-131); trails engine/configuration.ts:~91-97 returns
  the bare config arrays only.
- trails' paths registry has no autoload/autoload_once flags — Rails
  `Paths::Path` exposes `autoload?`/`autoload_once?` filtered via `filter_by`
  (railties/lib/rails/paths.rb:97-110), and the default path set marks
  `test/mailers/previews` `autoload: true` (engine/configuration.rb:112).
- The flag machinery pattern to copy is PR #5105's `eagerLoad` (Path flag +
  Root filter over existentDirectories); making the all\* accessors async
  ripples to engine.ts:147-148 (`_allAutoloadPaths` loop).

## Acceptance criteria

- `allAutoloadPaths`/`allAutoloadOncePaths` union the paths-registry
  contributions per configuration.rb:123-131, with autoload/autoload_once
  flags on Path mirroring paths.rb, or the omission is justified at the call
  site and wide-excluded coherently.
- engine.ts callers updated; engine.test.ts assertions extended.
