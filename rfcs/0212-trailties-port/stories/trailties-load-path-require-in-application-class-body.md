---
title: "trailties-load-path-require-in-application-class-body"
status: ready
updated: 2026-11-09
rfc: "0212-trailties-port"
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

`vendor/rails/v8.0.2/railties/test/application/initializers/load_path_test.rb:27-43` runs
`require "foo"` and `defined?(Foo)` inside the `Application` class body. trails'
`addToConfig` (`packages/trailties/src/test-helpers/isolation/abstract-unit.ts:360`) inserts
into the generated `static {}` block (`generators/trails/app/templates/config/application.ts.tt:8`),
which cannot await `rbFRequire`. The test is parked as `it.skip` in
`packages/trailties/src/application/initializers/load-path.test.ts`.

## Acceptance criteria

- Decide the shape (a top-level-await insertion point in `config/application.ts` for
  `addToConfig`, or a synchronous lib require) and record it in `packages/trailties/CLAUDE.md`.
- Un-skip "initializing an application allows to load code on lib path inside application class
  definition"; it passes and asserts `LOAD_PATH` includes `<app>/lib`.
