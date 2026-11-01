---
title: "trailties/all loads ActiveStorage::Engine"
status: done
updated: 2026-11-01
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9543
claim: "2026-10-31T17:48:46Z"
assignee: "activestorage-one-test-nested-attachment-attributes"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/all.rb:7` requires `active_storage/engine`, so a Rails app gets the engine with no wiring. `packages/trailties/src/all.ts` cannot import `@blazetrails/activestorage/engine`, because activestorage depends on trailties (`packages/activestorage/package.json`, `packages/activestorage/src/engine.ts` imports `@blazetrails/trailties/engine`). An app must import the engine itself.

## Acceptance criteria

- An application that imports only `@blazetrails/trailties/all` loads `ActiveStorage::Engine`, as `all.rb:7` does, with no package cycle.
- `Base` then includes `Attached::Model` after a boot, covered by a test in `packages/trailties/src/all.trails.test.ts`.
