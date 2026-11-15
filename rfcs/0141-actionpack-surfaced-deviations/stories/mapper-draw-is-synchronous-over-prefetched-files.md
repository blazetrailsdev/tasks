---
title: "actionpack: Mapper#draw(name) is synchronous over prefetched route files"
status: draft
updated: 2026-11-15
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper::Resources#draw(name)` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1668-1683`) finds `#{path}/#{name}.rb` and calls `instance_eval(File.read(...))` synchronously, inside the outer `draw` block.

trails' `Mapper#draw` (`packages/actionpack/lib/action-dispatch/routing/mapper.ts:1394-1415`) is `async`: it awaits `loadIseqEval(routePath, true)` and then calls the file's `drawRoutes` export. Since trails#10141, `RoutesReloader` records a routes file's `draw` blocks during an awaited `prefetchBang` and replays them synchronously in `load_paths` (`packages/trailties/lib/application/routes-reloader.ts`). So a nested `draw :admin` inside a replayed block returns a floating promise. Its routes land after `finalize!`, or never.

## Converged shape

`Mapper#draw` is synchronous, as in Rails. The nested file's `drawRoutes` is loaded ahead of time: `RoutesReloader#prefetchBang` also loads every `draw_paths` file (`config/routes/*.ts`), and `draw(name)` reads the prefetched export in line. It raises Rails' `ArgumentError` ("Your router tried to #draw the external file ...") when the file was not found.

## Acceptance criteria

- `Mapper#draw(name)` returns `void` and draws the nested routes before the outer block returns.
- `RoutesReloader#prefetchBang` prefetches the route set's `draw_paths` files.
- A test draws `config/routes/admin.ts` from `config/routes.ts` through `RoutesReloader` and asserts its routes exist after `executeUnlessLoaded()` with no await.
