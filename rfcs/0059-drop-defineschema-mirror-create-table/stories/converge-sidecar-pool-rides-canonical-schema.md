---
title: "Eliminate the sidecar test pool; converge callers to Base.connection / in-test PoolConfig (mirror connection_pool_test.rb)"
status: ready
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps:
  - create-table-canonical-schema-loader
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails
fidelity above all else.** (Supersedes the earlier framing of this story — "make
the sidecar ride the canonical schema" — which _ratified_ the sidecar instead of
converging it. Surfaced converting the relation tests, PR #4452.)

**Rails has no "sidecar test pool."** Confirmed against source:
`grep -r sidecar vendor/rails/activerecord/test` = 0 hits. Rails has ONE test
database and ONE pool; every test uses `ActiveRecord::Base.connection`. When a
test genuinely needs its own pool (pool mechanics), it builds one **in-test from
the primary config** — `vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30`:

```ruby
# Keep a duplicate pool so we do not bother others
config = ActiveRecord::Base.connection_pool.db_config
@db_config = HashConfig.new(config.env_name, config.name,
  config.configuration_hash.merge(checkout_timeout: 0.2))
@pool_config = PoolConfig.new(ActiveRecord::Base, @db_config, :writing, :default)
@pool = ConnectionPool.new(@pool_config)
```

The `db_config` is derived FROM `Base.connection_pool.db_config`, so the
constructed pool rides the SAME (schema-loaded) database — never a separate DB
handle.

trails instead has a standing **sidecar `_pool`** singleton
(`packages/activerecord/src/test-adapter.ts`: `_establishPooledTestPool` at
`:117`, module-boot `_pool` at `:194`) pointed at a DIFFERENT sqlite handle than
`Base.connection` (`file:trails_test_N?mode=memory&cache=shared` vs the primary
`:memory:`). That divergent handle is a trails invention with no Rails
counterpart, and its schema-less `:memory:`-fallback path is exactly why
sidecar-leased suites (e.g. `relation.trails.test.ts`'s `isBlank/isPresent`)
had to `createTable("developers")` in-test. Patching the sidecar's schema
ratifies the invention; eliminating it converges to Rails and deletes the bug.

Callers split cleanly:

- **Convenience — just need a connection** (use `Base.connection`, like Rails):
  - `createSidecarTestAdapter()`: `attribute-methods/{query,read,write,
time-zone-conversion}.test.ts`, `relation/{arel-ast-convergence,
build-arel-helpers,unscope-coverage}.test.ts`.
  - `createTestAdapter()` (18): the `associations/join-dependency-*` suite,
    `associations/{collection-proxy-count,loader-methods,reload-owner-repoint,
sti-owner-through-foreign-key}.test.ts`,
    `persistence/reload-association-cache.test.ts`, and the `test-helpers/*`
    self-tests.
- **Genuine pool mechanics** (build the pool in-test, mirror connection_pool_test.rb):
  - `createPooledTestAdapter()`: `test-helpers/pooled-test-adapter.test.ts`,
    `test-helpers/with-transactional-fixtures.test.ts`.

## Acceptance criteria

- Retire the standing sidecar `_pool` and its convenience helpers
  (`createSidecarTestAdapter`, and `createTestAdapter` if it only exists to lease
  from `_pool`) from `test-adapter.ts`. Convenience callers use `Base.connection`
  (the primary, schema-loaded pool) exactly as the Rails counterpart test does.
- Pool-mechanics callers construct their pool in-test from `Base.connection_pool`
  / the primary `db_config` + a `PoolConfig`, mirroring
  `connection_pool_test.rb:16-30` — so it rides the canonical schema DB, NOT a
  separate handle. `createPooledTestAdapter` may remain only if reworked to
  derive from the primary config (no bespoke second DB).
- The schema-less-fallback disappears: `relation.trails.test.ts`'s
  `isBlank/isPresent` suite drops its in-test `createTable/dropTable("developers")`
  and rides the canonical `developers` table (revisit/remove its
  `AR_NO_AUTO_SCHEMA` stub). Audit all former sidecar callers for the same
  now-unnecessary bespoke `create_table` workaround and remove it.
- No test renames; `test:compare` delta >= 0; sqlite `:memory:` single-worker,
  template-clone CI lane, and PG/MySQL URL-DB lanes all unaffected.
- Read the corresponding Rails test for each converted suite first (fidelity
  above all else). This spans ~29 caller files and will exceed 500 LOC — do NOT
  stack; ship it as per-area PRs and register follow-up stories per the epic
  split rule (e.g. join-dependency batch, attribute-methods/relation batch,
  pool-mechanics rework) rather than one mega-PR.
