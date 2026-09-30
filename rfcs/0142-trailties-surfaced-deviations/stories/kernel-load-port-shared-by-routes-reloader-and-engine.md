---
title: "Port Kernel#load once; Engine#loadSeed/loadConfigInitializer re-evaluate like load"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

Rails calls `Kernel#load` (`rb_f_load`, `vendor/ruby/v3.3.11/load.c:903`, defined at `:1615`) at three trailties sites. Each call re-evaluates the file every time it runs:

- `RoutesReloader#load_paths`: `paths.each { |path| load(path) }` (`vendor/rails/v8.0.2/railties/lib/rails/application/routes_reloader.rb:63-65`)
- `Engine#load_seed`: `run_callbacks(:load_seed) { load(seed_file) }` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:560-563`)
- `Engine#load_config_initializer`: `load(initializer)` inside the Notifications instrument block (`engine.rb:691-695`)

trails has no Kernel#load, so each site open-codes a dynamic `import`, in two different ways:

- `packages/trailties/src/application/routes-reloader.ts` `loadPaths` imports `pathToFileURL(path)` with a `?load=N` search param from a module-level counter, so each call re-evaluates the file (trails#8303).
- `packages/trailties/src/engine.ts` `loadConfigInitializer` / `loadSeed` import the bare `pathToFileURL(...)`. ESM caches that module, so a second `loadSeed` call (for example `db:seed` run twice in one process, or `db:seed:replant`) does not re-run seeds. Rails does re-run them.

Because no `load` name exists on the TS side, `parity:api:calls` cannot see any of the three omissions. `load_paths` carries a `@missingRailsCall call — PERMANENT` receipt only for `run_after_load_paths.call`.

## Converged shape

Port `Kernel#load` once, in `@blazetrails/ruby-compat`, as an async function spelled `load` (or whatever the ruby-compat MRI naming convention yields for `rb_f_load`). It re-evaluates on every call, using the fresh-URL technique `routes-reloader.ts` already uses. It carries a `@noRailsEquivalent PERMANENT` receipt per the package's rule 2. The three trailties sites become `await load(path)` at the Rails call site, and the inline import copies are deleted.

## Acceptance criteria

- [ ] ruby-compat exports a Kernel#load port that re-evaluates the file on each call, citing `load.c:903`. Test: the same file loaded twice runs its body twice.
- [ ] `RoutesReloader#loadPaths`, `Engine#loadSeed` and `Engine#loadConfigInitializer` call it; no inline `import(pathToFileURL(...))` remains at these sites.
- [ ] Test: `loadSeed` called twice runs the seed file twice (mirrors `load` semantics, `engine.rb:562`).
- [ ] `parity:api:calls` / `parity:api:extra:gate` stay green.
