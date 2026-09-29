---
title: "routes-reloader-reload-bang-invented-loader-param"
status: done
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8246
claim: "2026-09-29T18:58:38Z"
assignee: "routes-reloader-reload-bang-invented-loader-param"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/application/routes-reloader.ts` `RoutesReloader#reloadBang(loader = loadRoutesFile)`
takes an injectable `loader` parameter that Rails does not have. Rails'
`reload!` (`vendor/rails/v8.0.2/railties/lib/rails/application/routes_reloader.rb:24-30`)
calls private `clear!` / `load_paths` / `finalize!` / `revert` (`:55-78`), and
`load_paths` is `paths.each { |path| load(path) }` followed by
`run_after_load_paths.call`. trails inlines all four private helpers into
`reloadBang`, and a module-level `loadRoutesFile` function stands in for
`Kernel#load`. The parameter exists only so `routes-reloader.test.ts` can inject
a fake loader.

## Acceptance criteria

- [ ] `reloadBang()` takes no parameters and delegates to private `clearBang`, `loadPaths`, `finalizeBang` and `revert`, with the Rails names, per `routes_reloader.rb:24-30,55-78`.
- [ ] Tests drive `load_paths` through real route files on disk, not an injected loader.
