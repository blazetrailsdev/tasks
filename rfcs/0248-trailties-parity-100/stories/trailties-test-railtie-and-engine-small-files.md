---
title: "trailties: port lazy_route_set app-level request and url_for tests"
status: ready
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: test-ports
packages: [trailties]
deps: [trailties-test-move-misplaced-tests]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/railties/test/engine/lazy_route_set_test.rb` has two
app-level tests that run on the unit harness in
`packages/trailties/test/engine/lazy-route-set.test.ts` (a bare `LazyRouteSet`
with a stubbed `Trails.application.reloadRoutesUnlessLoaded`):
`app lazily loads routes when making a request` (`:45`) and
`app lazily loads routes when url_for is used` (`:85`).

The rest of this story's original scope (the engine and booted-app
`lazy_route_set_test.rb` tests, `railtie_test.rb`, `mounted_engine_test.rb`,
`engine_test.rb`, `engine/commands_test.rb`, `engine/test_test.rb`) moved to
`trailties-test-railtie-and-engine-small-files-rest`.

## Acceptance criteria

- [ ] Both tests are matched in `pnpm parity:test -- --package trailties`, with Rails' assertions.
