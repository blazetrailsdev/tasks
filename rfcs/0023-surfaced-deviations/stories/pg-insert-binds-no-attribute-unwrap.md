---
title: "PostgreSQL insert() bind path does not unwrap ActiveModel::Attribute (QueryAttribute)"
status: draft
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting the MySQL bind probe in #3218
(`mysql-binds-no-attribute-unwrap`). A cross-adapter
`Relation::QueryAttribute` bind round-trip
(`adapter_test.rb` `test_select_all_insert_update_delete_with_binds`)
fails on PostgreSQL at the INSERT step:

```text
StatementInvalid: invalid input syntax for type integer:
  "{"name":"id","_valueBeforeTypeCast":1,...,"_cachedValueForDatabase":1,...}"
  (code 22P02, unnamed portal parameter $1)
```

The `QueryAttribute` object reaches `pg` as `$1` **unwrapped** — i.e. the
PostgreSQL `insert()` / `execInsert` write path does NOT run binds through
`typeCastedBinds` the way the SELECT path
(`postgresql-adapter.ts` `typeCastedBinds(binds).map(this._bindForPg)`)
does. Rails' `type_casted_binds` (abstract/quoting.rb:198) sends
`value_for_database` for an `ActiveModel::Attribute` on every bind path.

Because the error aborts the PG transaction, it also poisons
transactional-fixtures teardown for subsequent suites in the file (the
`usesTransaction` gotcha). The MySQL story scoped its new test to
`adapterType === "mysql"` to avoid exercising this latent PG gap; this
story tracks fixing it.

## Acceptance criteria

- [ ] The PostgreSQL `insert()` / `execInsert` driver-bind path unwraps
      `ActiveModel::Attribute` to `valueForDatabase` (via `typeCastedBinds`
      or equivalent), matching the SELECT path and Rails' `type_casted_binds`.
- [ ] A `QueryAttribute` bind round-trip analogous to
      `test_select_all_insert_update_delete_with_binds` passes against
      PostgreSQL (extend the existing test in `adapter.test.ts` to include
      `adapterType === "postgres"`).
