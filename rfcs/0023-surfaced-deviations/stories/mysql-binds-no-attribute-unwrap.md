---
title: "MySQL mysqlBinds does not unwrap ActiveModel::Attribute (QueryAttribute) to value_for_database"
status: ready
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting the `AdapterTest` bind probes in #3176
(`f9b-adapter-transaction-restore-residuals`). Rails' `type_casted_binds`
(abstract/quoting.rb:224) sends `value_for_database` to the driver when a bind
is an `ActiveModel::Attribute`:

```ruby
binds&.map do |value|
  ActiveModel::Attribute === value ? type_cast(value.value_for_database) : type_cast(value)
end
```

In trails:

- **SQLite** now unwraps Attribute binds via `_driverBind`
  (`connection-adapters/sqlite3-adapter.ts`, added in #3176).
- **PostgreSQL** unwraps via `typeCastedBinds(binds).map(this._bindForPg)`
  (`connection-adapters/postgresql-adapter.ts:774,1253`).
- **MySQL** does NOT: `mysqlBinds` (`connection-adapters/mysql2-adapter.ts:726`)
  only maps `true→1 / false→0` and passes everything else (including a
  `Relation::QueryAttribute`) straight to the driver — the bind reaches the
  mysql2 client unwrapped.

Behaves differently on MySQL than Rails / the other adapters. Not currently
exercised by a passing MySQL test, so latent.

## Acceptance criteria

- [ ] The MySQL driver-bind path unwraps `ActiveModel::Attribute` to
      `valueForDatabase` before binding, matching `type_casted_binds` and the
      SQLite/PG paths.
- [ ] A bind round-trip test analogous to `adapter_test.rb`
      `test_select_all_insert_update_delete_with_binds` passes against MySQL.
