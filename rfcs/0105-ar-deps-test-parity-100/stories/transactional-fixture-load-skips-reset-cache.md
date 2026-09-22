---
title: "Transactional fixture load skips FixtureSet.reset_cache"
status: done
updated: 2026-09-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: trails#7976
claim: "2026-09-22T16:47:52Z"
assignee: "serializer-with-fallback-interpolated-title-extractor-mismatch"
blocked-by: null
closed-reason: null
---

## Context

trails#7808 made `useFixtures` load fixture sets once under transactional tests,
mirroring `setup_fixtures` (`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:125-138`).
Rails calls `ActiveRecord::FixtureSet.reset_cache` only in the non-transactional
branch (`:136`). trails' `loadFixtures` callback in `useFixtures`
(`packages/activerecord/src/test-fixtures.ts`, the closure passed to
`loadFixturesOnce`) resets it on every load, including a transactional cache miss.

Removing that reset reds 24 tests in `test-fixtures.test.ts` / `fixtures.test.ts`.
`FixtureSet`'s set cache (`fixtures.ts` `cacheForConnectionPool`) is keyed per
connection pool. The mock-adapter describes (`connection: () => makeAdapter()`)
all resolve to a NullPool, so they share a key, and the cache claims sets are
already inserted into the real database when they are not.

## Acceptance criteria

- The transactional cache-miss load no longer calls `FixtureSet.resetCache()`,
  matching `test_fixtures.rb:128-131`. The reset stays only on the
  non-transactional path (`:136`).
- Mock-adapter / NullPool describes stop sharing a `FixtureSet` pool-cache key,
  for example by converging those tests onto the canonical connection, so the
  24 tests stay green.
