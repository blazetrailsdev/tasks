---
title: "Routes files draw into their own route set; drop the drawRoutes export fan-out"
status: draft
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RoutesReloader#load_paths` in Rails is `paths.each { |path| load(path) }`
(`vendor/rails/v8.0.2/railties/lib/rails/application/routes_reloader.rb:63-65`).
`config/routes.rb` itself calls `Rails.application.routes.draw do ... end`,
so each file draws into exactly the route set it names.

In trails, `loadRoutesFile` (`packages/trailties/src/application/routes-reloader.ts`)
imports the file, reads an exported `drawRoutes(mapper)` function, and calls
`set.draw?.(...)` on **every** set in `this.routeSets`. An engine's routes file
therefore draws into the application's route set as well, and the reverse. The
file's own `draw` call is also replaced by an export convention Rails doesn't have.
`RouteSetLike.draw` is optional, so a set without it silently draws nothing.

Each load also imports a fresh `?load=N` URL (trails#8246) to mirror `load`'s
re-evaluation, and ESM never frees the superseded module instances.

## Acceptance criteria

- [ ] A trails routes file draws itself, `Trails.application.routes().draw((mapper) => ...)` or the engine's `routes()`, mirroring `config/routes.rb`, and `loadPaths` only evaluates it (`routes_reloader.rb:63-65`).
- [ ] The `drawRoutes` export convention and the fan-out over `routeSets` are removed. The generator's `config/routes.ts` template and the fixtures are updated to match.
- [ ] An engine with its own routes file doesn't draw into the application's route set (test).
