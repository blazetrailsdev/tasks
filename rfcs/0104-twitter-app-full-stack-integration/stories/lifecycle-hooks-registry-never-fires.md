---
title: "lifecycle-hooks-registry-never-fires"
status: in-progress
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: 7493
claim: "2026-09-04T19:50:50Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

`Railtie::Configuration`'s five lifecycle registrars each route through
`ActiveSupport.on_load(..., yield: true)`
(`railties/lib/rails/railtie/configuration.rb:54-77`), and the application fires
them with `run_load_hooks` (`railties/lib/rails/application.rb:560` and the
Bootstrap/Finisher sites).

trails stores the blocks in a class-side registry instead
(`packages/trailties/src/trailtie/configuration.ts` — `_lifecycleBlocks`, pushed
by `beforeConfiguration` / `beforeInitialize` / `beforeEagerLoad` /
`afterInitialize` / `afterRoutesLoaded`, drained by `runHook`).

`runHook`'s only caller is a test. Application boot fires the ordinary load
hooks — `runLoadHooks("before_configuration", …)` (`application.ts`),
`runLoadHooks("before_initialize", …)` (`application/bootstrap.ts`),
`runLoadHooks("before_eager_load" | "after_initialize" | "after_routes_loaded", …)`
(`application/finisher.ts`) — which read the `onLoad` registry, not
`_lifecycleBlocks`. So a block registered through `config.afterInitialize(...)`
never runs at boot.

## Converged shape

The five registrars call `onLoad(<ruby hook name>, block)`, as
`configuration.rb:54-77` does. `yield: true` needs no separate spelling:
`executeHook` is `block(base)` unconditionally
(`packages/activesupport/src/lazy-load-hooks.ts`), which is exactly what the
flag selects in Ruby. Every firing site already exists, so nothing else moves.

`_lifecycleBlocks`, `runHook` and `lifecycleHooks()` then have no callers and
are deleted — their own `@noRailsEquivalent CONVERGEABLE` receipts already say
they retire with this.

This was built and verified once, in PR #7386, which was closed unmerged for an
unrelated reason (it moved `Rails::Railtie` to the wrong package); the diff
there is a working reference.

## Acceptance criteria

- [ ] The five registrars go through `onLoad`.
- [ ] `_lifecycleBlocks` / `runHook` / `lifecycleHooks` are deleted, not
      re-justified.
- [ ] A regression test boots an `Application` and asserts a
      `config.afterInitialize` block runs; it must fail on today's code.
- [ ] `trailtie.test.ts`'s `Configuration#<hook> block runs when <hook> hook
fires` cases keep their names.
