---
title: "retire-postgresql-columns-override-for-column-definitions"
status: claimed
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 6
pr: null
claim: "2026-09-03T15:51:19Z"
assignee: "converge-future-result-event-buffer-instrument"
blocked-by: null
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
