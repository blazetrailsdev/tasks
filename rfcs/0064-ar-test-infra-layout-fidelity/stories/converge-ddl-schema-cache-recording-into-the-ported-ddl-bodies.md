---
title: "Retire the per-test DDL adapter monkey-patching by clearing the schema cache where Rails does"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6284
claim: "2026-08-09T15:42:26Z"
assignee: "converge-ddl-schema-cache-recording-into-the-ported-ddl-bodies"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `fixture-harness-wrappers-restore-own-property-shadowing-prototype`
(PR #6280), which converged the _restore_ half of this wrapper but left the
wrapper itself in place.

`recordDdlTouchedTables`
(`packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`)
monkey-patches fourteen adapter DDL methods (`DDL_TABLE_ARGS`) on the pooled
adapter instance for the duration of every transactional test, so it can call
`clearDataSourceCacheBang` for the tables the DDL names and re-reflect them at
teardown (`reReflectTouchedTables`).

Rails patches nothing. `setup_fixtures` / `teardown_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:113`, `:146`,
`:206-211`) pin and unpin the pool and touch no adapter method. Rails needs no
harness-side recording because the DDL bodies clear the cache themselves:
`create_table`'s non-force arm and `drop_table` both call
`clear_cache!` / `schema_cache.clear_data_source_cache!`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:306`
and `:542`). The wrapper's own JSDoc says as much — it exists because the
_ported_ bodies omit the clear Rails has, and it papers over that in the
harness rather than in the port.

The remaining wrapper is not free: it is the mechanism that produced the
own-property shadowing bug PR #6280 fixed, and any adapter method it wraps is
invisible to a prototype-level spy for the duration of a test.

## Converged shape

Port the cache invalidation into the DDL bodies where Rails has it — the
`clear_cache!` in `create_table` (`schema_statements.rb:306`) and
`drop_table` (`:542`) — then delete `DDL_TABLE_ARGS`, `recordDdlTouchedTables`
and the `_restoreDdlRecording` threading in `withTransactionalFixtures`.

Note the harness currently records **fourteen** methods where Rails clears from
**two**. The other twelve (`addColumn`, `addIndex`, `changeTable`, …) are
trails-only invalidation; converging means letting them go unrecorded exactly
as Rails does, not adding a `clear_cache!` Rails does not have. Whether
`reReflectTouchedTables` survives at all should be decided against
`SchemaCache`'s Rails lifecycle rather than preserved by default — Rails' cache
is pool-scoped and persistent, and its tests do not re-reflect between cases.

The `invalidateSchemaCache` option on `WithTransactionalFixturesOptions` is the
public surface of this machinery and goes with it.

## Acceptance criteria

- [ ] `create_table` / `drop_table`'s ported bodies clear the schema cache at
      the Rails call sites (`schema_statements.rb:306`, `:542`).
- [ ] `recordDdlTouchedTables`, `DDL_TABLE_ARGS` and the per-test adapter
      monkey-patching are deleted; `withTransactionalFixtures` patches no
      adapter method, like `setup_fixtures`.
- [ ] `reReflectTouchedTables` and the `invalidateSchemaCache` option are
      removed or individually justified against Rails' `SchemaCache` lifecycle.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
