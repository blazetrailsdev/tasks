---
title: "trailties-test-railtie-and-engine-small-files-rest"
status: ready
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
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

Left over from `trailties-test-railtie-and-engine-small-files`, which ported the
app-level `lazy_route_set_test.rb` request and `url_for` tests into
`packages/trailties/test/engine/lazy-route-set.test.ts` (unit harness: a bare
`LazyRouteSet` with a stubbed `Trails.application.reloadRoutesUnlessLoaded`).

Still Miss in `pnpm parity:test -- --package trailties`:

- `vendor/rails/v8.0.5.2/railties/test/engine/lazy_route_set_test.rb`: the
  engine variants (`:24`, `:38`, `:75`, `:97`), `polymorphic_url` (`:55`) and
  `railties can access lazy routes` (`:109`). These need a mounted `Plugin::Engine`
  and a booted app, so they belong on the isolation harness
  (`packages/trailties/test/support/isolation/abstract-unit.ts`).
- `railties/railtie_test.rb` (10), `railties/mounted_engine_test.rb` (3),
  `engine_test.rb` (2), `engine/commands_test.rb` (6), `engine/test_test.rb` (1).

## Acceptance criteria

- [ ] Every listed Rails test matched in `pnpm parity:test -- --package trailties`.
- [ ] No new `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
