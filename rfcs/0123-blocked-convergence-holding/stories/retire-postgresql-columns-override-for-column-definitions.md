---
title: "retire-postgresql-columns-override-for-column-definitions"
status: blocked
updated: 2026-09-03
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 6
pr: 7446
claim: "2026-09-03T15:51:19Z"
assignee: "converge-future-result-event-buffer-instrument"
blocked-by: "Attempted in #7446 and reverted: deleting the columns override deadlocks the PG lane. Reproduced locally against postgres:17 and bisected to this story alone (restoring the three beginTransaction overrides does NOT help; restoring the columns override does). Chain: the abstract columns (abstract/schema-statements.ts:797) reaches PostgreSQLAdapter#columnDefinitions, whose port — faithfully, per postgresql_adapter.rb:1034 — awaits supportsIdentityColumns()/supportsVirtualColumns() before building the SQL. Those read databaseVersion -> pool.serverVersion(), which takes the POOL mutex and then getDatabaseVersion() -> withRawConnection(), which takes the ADAPTER lock. columns() already runs under the adapter lock, and on a pool whose _serverVersion is not yet memoized this inverts the lock order and hangs: base.test.ts 'connection in local time' / 'connection in utc time' (which call establishConnection, creating a FRESH pool) time out in the withTransactionalFixtures afterEach at 30s, and every later test in the file cascades on PG 25P02. Instrumented columnDefinitions shows three concurrent entries for 'defaults' all parked in supportsIdentityColumns. Rails does not hit this because configure_connection calls check_version (abstract_adapter.rb:1212), so database_version is memoized on the pool before any column_definitions can run, while trails' _maybeConfigureConnection (postgresql-adapter.ts:482) is lazily gated on _connectionConfigured and can race the first columns() on a newly established connection. Converging this story needs that version warm-up / lock-ordering fix first; the override deletion itself is a two-line change once the deadlock is gone. Note the deleted override's batched loadAdditionalTypes was a trails optimisation the story correctly retires (Rails loads per-OID via get_oid_type), and the three trails-only tests in postgresql/schema-statements.trails.test.ts 'SchemaStatements#columns delegates to newColumnFromField' cover the bespoke query and go with it."
closed-reason: null
---

## Context

Rails' PostgreSQL adapter defines **no** `columns` override. `columns` lives
once, on the abstract adapter
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:120`):

```ruby
def columns(table_name)
  table_name = table_name.to_s
  column_definitions(table_name).map do |field|
    new_column_from_field(table_name, field, column_definitions)
  end
end
```

and each adapter supplies only the private `column_definitions` +
`new_column_from_field` pair —
`connection_adapters/postgresql_adapter.rb:1034` and `:1060`.

trails instead overrides `columns` in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:485`
with a **second, differently-shaped catalog query** (aliased `name`/`type`/
`default`/`notnull`/`oid`/`fmod`/`identity`/`attgenerated`/`collation`/
`col_comment`, joined through `pg_class`/`pg_namespace`, bind-parameterised on
`to_regclass`), plus an inline missing-OID `loadAdditionalTypes` pass and a
hand-built positional `field` array. The result is that
`PostgreSQLAdapter#columnDefinitions` — which PR #7423 moved onto
`postgresql-adapter.ts` at its Rails name and converged onto Rails' `query(sql,
"SCHEMA")` body — has **no caller at all** on the PG path. Two catalog queries
for one concept, one of them dead.

The MySQL side already has it the Rails way round
(`connection-adapters/abstract-mysql-adapter.ts:169` calls
`this.columnDefinitions(tableName)`), so this is PG-only drift.

## Acceptance criteria

- [ ] `postgresql/schema-statements.ts` no longer overrides `columns`; the PG
      path goes through the abstract `columns` →
      `PostgreSQLAdapter#columnDefinitions` → `newColumnFromField` chain, as
      `abstract/schema_statements.rb:120` does.
- [ ] Whatever the override supplied that `column_definitions` does not — the
      missing-OID `loadAdditionalTypes` pass in particular — lands where Rails
      puts it (`new_column_from_field` reaches the type map through
      `fetch_type_metadata`, `postgresql_adapter.rb:1060-1080`) rather than in
      a `columns` wrapper.
- [ ] The bespoke second catalog query is deleted, not kept alongside.
- [ ] `pnpm parity:api:extra --package activerecord` shows `columns` gone from
      `postgresql/schema-statements.ts`'s extra surface; the mark is tightened.
- [ ] The PG lane passes, including `schema-dumper.test.ts` and the column /
      reflection cases.
