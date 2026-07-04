---
title: "Primary test config should inherit Rails' default pool size (5), not pin pool:1"
status: done
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4542
claim: "2026-07-04T11:56:50Z"
assignee: "converge-primary-test-pool-size-to-rails-default"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by RFC 0059 `retire-sidecar-pool-rework-pool-mechanics` (PR #4532).

trails' primary sqlite test config pins `pool: 1`
(`packages/activerecord/src/test-helpers/test-database-config.ts:42` and the
`establishFromTestConfig` fallback at `:103`). Rails' primary test config
leaves `pool` unset, so `HashConfig#pool` defaults to 5
(`vendor/rails/activerecord/lib/active_record/database_configurations/hash_config.rb:72`
— `(configuration_hash[:pool] || 5).to_i`). So trails' primary pool is a
single-connection pool where Rails' is a 5-connection pool.

This deviation forced a workaround in PR #4532: when building the in-test
duplicate pool for pool-mechanics suites (mirroring
`connection_pool_test.rb:16-30`, which derives from
`Base.connection_pool.db_config`), `test-adapter.ts`'s `buildInTestPool` has to
**strip** the primary's pinned `pool: 1` so the duplicate inherits Rails'
default-5 multi-connection shape — otherwise `pinConnectionBang` mechanics tests
deadlock on a 1-connection pool. Rails does no such strip; its duplicate simply
inherits the primary's 5.

Likely rationale for the pin: better-sqlite3 is a single-backend driver, and
separate connections to a bare `:memory:` database get separate empty DBs. On
the file-backed per-worker clone lane (the canonical CI lane) multiple
connections share the file, so pool > 1 is safe there; only pure `:memory:`
(no `AR_TEST_WORKER_DB`) is the constrained case — exactly Rails' `in_memory_db?`.

## Acceptance criteria

- Primary test config no longer pins `pool: 1` on the file-backed lane; it
  inherits Rails' default (5), matching `hash_config.rb:72`.
- The `pool`-stripping workaround in `test-adapter.ts` `buildInTestPool` is
  removed (the duplicate inherits the primary's size directly, like Rails).
- Pure `:memory:` behavior is preserved (gate the size to the file-backed lane
  if a bare `:memory:` primary genuinely needs size 1).
- No test renames; all lanes green; `test:compare` delta >= 0.
