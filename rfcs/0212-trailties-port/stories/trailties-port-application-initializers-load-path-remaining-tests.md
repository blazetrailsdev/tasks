---
title: "trailties-port-application-initializers-load-path-remaining-tests"
status: in-progress
updated: 2026-11-08
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9854
claim: "2026-11-08T00:15:22Z"
assignee: "trailties-port-application-initializers-load-path-remaining-tests"
blocked-by: null
closed-reason: null
---

## Context

The pilot ported 4 of the 6 tests in
`vendor/rails/v8.0.2/railties/test/application/initializers/load_path_test.rb` into
`packages/trailties/src/application/initializers/load-path.test.ts`. Two remain:

- "initializing an application allows to load code on lib path inside application class
  definition" (`:27-43`). Rails runs `require "foo"` and `defined?(Foo)` inside the
  `Application` class body. trails' `addToConfig` inserts into a `static {}` block, and that
  block cannot await `rbFRequire`. The test needs a decided shape: either a top-level await
  insertion point in `config/application.ts`, or a sync require for a lib file.
- "eager loading loads parent classes before children" (`:57-72`). `class Zoo; include
ReptileHouse; end` needs `Zoo::ReptileHouse` autoloaded while `Zoo`'s body runs (Zeitwerk
  namespace autoload).

## Acceptance criteria

- Both tests are ported with names verbatim and pass, or are skipped as BLOCKED on a filed
  story.
