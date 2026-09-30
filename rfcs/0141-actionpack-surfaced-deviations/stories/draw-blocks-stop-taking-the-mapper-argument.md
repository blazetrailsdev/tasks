---
title: "draw-blocks-stop-taking-the-mapper-argument"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
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
closed-reason: null
---

## Context

`RouteSet#eval_block` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:474-481`)
runs the draw block as `mapper.instance_exec(&block)`, and `Mapper#with_default_scope`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:645-649`) does the same.
`instance_exec` passes no argument: the mapper is only `self`.

`route-draw-block-runs-with-the-mapper-as-this` made trails' `evalBlock` / `withDefaultScope`
run the block with the mapper as `this`, and made every generator, the `trails new` routes file
and the finisher's internal routes use `function () { this.get(...) }`. To stay within the PR
ceiling it kept passing the mapper as a SECOND, positional argument too —
`block.call(mapper, mapper)` in `packages/actionpack/src/action-dispatch/routing/route-set.ts`
(`evalBlock`) and `block.call(this, this)` in `packages/actionpack/src/action-dispatch/routing/mapper.ts`
(`withDefaultScope`), each carrying `@missingRailsArgs instance_exec — CONVERGEABLE
draw-blocks-stop-taking-the-mapper-argument`, and `DrawCallback` is
`(this: Mapper, mapper: Mapper) => void`. That argument exists only because ~500 test call sites
(`git grep -nE "\.draw\(\(" packages`, 62 files, mostly `packages/actionpack/src/**/*.test.ts`,
plus `packages/actionpack/src/test-helpers/abstract-unit.ts:86,97,160`,
`packages/trailties/src/__fixtures__/hello-world/app.ts:11`,
`packages/website/src/lib/frontiers/app-server.ts:21,49`) still spell `draw((r) => { r.get(...) })`,
and test stubs in `packages/trailties/src/application/{finisher,routes-reloader}*.test.ts`
call `block.call(mapper, mapper)`.

Nested DSL blocks (`namespace`, `scope`, `resources`, `member`, …) are a related gap:
Rails' Mapper runs them with `yield` (mapper.rb:903,918,1047,1358,1528,1637,…), i.e. with no
argument, where trails calls `cb(this)` (mapper.ts `cb(this)` / `callback(this)` sites). Under a
`function () {}` draw block the nested block is an arrow capturing `this`, which is the faithful
mirror of `yield`; the `cb(this)` argument can be dropped once no caller reads it.

## Acceptance criteria

- [ ] Every `draw` / `prepend` / `append` / `Engine#routes` block in the repo is a
      `function () { this.<dsl>(...) }` (nested blocks as `() => { this.<dsl>(...) }`).
- [ ] `DrawCallback` is `(this: Mapper) => void`; `evalBlock` calls `block.call(mapper)` and
      `withDefaultScope` calls `block.call(this)`; both `@missingRailsArgs` receipts are deleted.
- [ ] Nested Mapper callbacks are invoked with no argument (Rails `yield`), and `MapperCallback`
      takes none.
- [ ] Split across several PRs by directory if it exceeds the ceiling (non-overlapping files).
