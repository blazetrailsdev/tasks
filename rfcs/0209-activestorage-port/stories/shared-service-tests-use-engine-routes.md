---
title: "shared-service-tests-use-engine-routes"
status: ready
updated: 2026-10-30
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps:
  - activestorage-routes-and-controller-concerns
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

`packages/activestorage/src/service/shared-service-tests.ts:18-41` hand-draws the two
`rails_disk_service` routes (`vendor/rails/v8.0.2/activestorage/config/routes.rb:13-14`) on a
`new RouteSet()` and sets a stub `TopLevel.Trails`. This was the second acceptance criterion of
`disk-service-url-helpers-typed-seat`, which could not be done until
`activestorage-routes-and-controller-concerns` ports `config/routes.rb`.

## Acceptance criteria

- The shared service tests use the engine's routes instead of the hand-drawn RouteSet.
- The stub `TopLevel.Trails` in `shared-service-tests.ts` is removed.
