---
title: "Port test/dispatch/mount_test.rb with AppWithRoutes as a real Rails::Engine"
status: in-progress
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8407
claim: "2026-10-02T16:22:07Z"
assignee: "port-dispatch-mount-test-with-real-engine"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/mount_test.rb` (110 lines,
`TestRoutingMount < ActionDispatch::IntegrationTest`) has no trails port:
there is no `packages/actionpack/src/action-dispatch/dispatch/mount.test.ts`.

Its fixture at `mount_test.rb:9-15` is `class AppWithRoutes < Rails::Engine`
with a hand-written `self.routes`, mounted at `:38` as
`mount AppWithRoutes, at: "/shorthand_app"` — the one actionpack test that
mounts a real engine with no `as:`, so it is the only cover for
`Mapper#app_name`'s `app.railtie_name` arm (`routing/mapper.rb:661-668`) and
for `define_generate_prefix` (`:670-694`) through a derived name.

trails#8381 made `isRailsApp` answer `app < Rails::Railtie` and registered
the `@blazetrails/trailties/engine` and `@blazetrails/trailties/trailtie`
subpaths for actionpack tests (`packages/actionpack/tsconfig.test.json`,
`vitest.config.ts`). `prefix-generation.test.ts` and `integration.test.ts`
show the shape: `class X extends Engine`, `Engine.register(this, ...)` in a
static block, and a module-top `TopLevel.Trails = { Engine, Trailtie }` seat
standing in for `require "rails/engine"`.

## Acceptance criteria

- `packages/actionpack/src/action-dispatch/dispatch/mount.test.ts` ports
  every test in `mount_test.rb` with the Rails names verbatim, on
  `IntegrationTest`.
- `AppWithRoutes` is a real `Engine` subclass; no class defines a
  hand-written `railtieName`.
- The file is added to `packages/actionpack/tsconfig.test.json` and excluded
  from the main project. Nothing is added to actionpack's `package.json`.
- A test that cannot pass is parked as `it.skip` with the gap filed, not
  dropped.
