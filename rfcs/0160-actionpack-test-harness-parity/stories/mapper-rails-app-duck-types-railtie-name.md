---
title: "mapper-rails-app-duck-types-railtie-name"
status: in-progress
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8381
claim: "2026-10-02T03:01:57Z"
assignee: "mapper-rails-app-duck-types-railtie-name"
blocked-by: null
closed-reason: null
---

## Context

`Mapper#rails_app?` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:657-659`)
is `app.is_a?(Class) && app < Rails::Railtie`.

trails' `isRailsApp` (`packages/actionpack/src/action-dispatch/routing/mapper.ts:1518-1520`)
duck-types instead: any function with a truthy `railtieName`. That lets a
stand-in pass as a Rails app, and three ported test files still use one where
Rails defines a real `Rails::Engine` subclass:

- `packages/actionpack/src/action-controller/controller/integration.test.ts:884-903`
  — `class MountedApp` with a hand-written `static railtieName()` / `routes()` /
  `call()` (`test/controller/integration_test.rb:766` is
  `class MountedApp < Rails::Engine`).
- `packages/actionpack/src/action-dispatch/dispatch/prefix-generation.test.ts`
  (`test/dispatch/prefix_generation_test.rb:27,52,371`: `BlogEngine` and
  `RailsApplication` are `< Rails::Engine`).
- `test/dispatch/mount_test.rb:9` (`AppWithRoutes < Rails::Engine`); the trails
  port has no `mount.test.ts` engine case yet.

trails#8339 made actionpack tests able to import the real `Engine`
(`@blazetrails/trailties/engine`, compiled through
`packages/actionpack/tsconfig.test.json`) and replaced the stand-ins in
`routing-assertions.test.ts` and `routing/inspector.test.ts`. Those two seat
`TopLevel.Trails = { Engine }`; nothing seats `Railtie`, which `rails_app?`
names.

Do not add trailties to actionpack's `package.json`: a workspace dependency in
that direction makes a `node_modules` symlink cycle that recursive directory
walks follow (it timed out `parity:api:detached` on trails#8339). The tsconfig
`paths` entry and the vitest alias are the registration.

## Acceptance criteria

- `isRailsApp` answers `app < Rails::Railtie` (a class whose prototype chain
  reaches `TopLevel.Trails.Railtie`), not "has a `railtieName`".
- `integration.test.ts`'s `MountedApp` and `prefix-generation.test.ts`'s engine
  classes are real `Engine` subclasses, added to
  `packages/actionpack/tsconfig.test.json` and excluded from the main project.
- No actionpack test defines a class with a hand-written `railtieName`.
