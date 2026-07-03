---
title: "retire-sidecar-pool-rework-pool-mechanics"
status: claimed
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-07-03T18:09:50Z"
assignee: "retire-sidecar-pool-rework-pool-mechanics"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 follow-up split from `converge-sidecar-pool-rides-canonical-schema`
— the final batch. Reworks the genuine pool-mechanics callers and RETIRES the
standing sidecar `_pool` singleton and its convenience helpers from
`packages/activerecord/src/test-adapter.ts`
(`_establishPooledTestPool`, module-boot `_pool`, `createSidecarTestAdapter`,
and `createTestAdapter` if it only exists to lease from `_pool`).

Pool-mechanics callers (`test-helpers/pooled-test-adapter.test.ts`,
`test-helpers/with-transactional-fixtures.test.ts`, via
`createPooledTestAdapter`) must construct their pool IN-TEST from the primary
config, mirroring `vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30`:
derive `db_config` from `Base.connection_pool.db_config`, build a `PoolConfig`,
and `new ConnectionPool(...)` — so it rides the canonical schema DB, not a
separate sqlite handle. `ambientPoolConfiguration()` /
`_pooledSqliteDatabase()` (the `file:trails_test_N?mode=memory&cache=shared`
divergent handle) go away once the two convenience batches
(`converge-sidecar-convenience-callers-base-connection` and
`converge-createtestadapter-callers-base-connection`) have landed.

DEPENDS ON both convenience-caller stories landing first (they remove the last
`_pool` leases).

## Acceptance criteria

- Sidecar `_pool` + `createSidecarTestAdapter` (+ convenience `createTestAdapter`)
  removed from `test-adapter.ts`. `resetTestAdapterState` retargets the primary
  handler pool.
- Pool-mechanics callers build their pool in-test from the primary `db_config`
  - a `PoolConfig` (no bespoke second DB). No test renames; `test:compare`
    delta >= 0; all lanes unaffected.
