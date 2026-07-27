---
title: "fixture-set-missing-cache-and-reset-cache"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `LoadSchemaHelper#load_schema`
(`vendor/rails/activerecord/test/support/load_schema_helper.rb:18`, PR #5400):
its last statement is `ActiveRecord::FixtureSet.reset_cache`, which trails
cannot call because the surface does not exist.

Rails' `ActiveRecord::FixtureSet` keeps a class-level fixture cache keyed by
connection pool — `@@all_cached_fixtures` (`fixtures.rb:539`), read by
`cached_fixtures` (`fixtures.rb:561`), written by `cache_fixtures`
(`fixtures.rb:576`) from `create_fixtures` (`fixtures.rb:611`), and cleared by
`reset_cache` (`fixtures.rb:556`). The cache exists so a re-loaded schema cannot
be served rows built against the previous one.

trails' `packages/activerecord/src/test-helpers/fixture-set.ts` is a 20-line
static wrapper: `FixtureSet.createFixtures` delegates straight to
`defineFixtures` and caches nothing, so `cachedFixtures` / `cacheFixtures` /
`resetCache` are all absent. `loadSchema` therefore has no third arm at all —
documented in its JSDoc, but it is a missing-surface deviation, not a no-op by
design.

## Acceptance criteria

- Decide whether the cache is worth having in trails at all (Rails' motivation
  is repeated `create_fixtures` calls across a suite; trails' per-worker
  template/clone model may make it dead weight) and record the decision.
- If yes: port `cached_fixtures` / `cache_fixtures` / `reset_cache` with Rails'
  connection-pool keying, wire `createFixtures` to fill it, and call
  `resetCache` from `loadSchema` where Rails calls it.
- If no: record the deviation where `api:compare` can see it rather than only in
  `load-schema-helper.ts`'s prose.
