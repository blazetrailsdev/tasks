---
title: "insert-all-touch-timestamps-trailing-comma"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6568
claim: "2026-08-15T15:45:07Z"
assignee: "insert-all-touch-timestamps-trailing-comma"
blocked-by: null
closed-reason: null
---

# `touch_model_timestamps_unless` must terminate each entry with a comma

## Context

Surfaced converging the `build_insert_sql | map` call-set row on
`connection-adapters/sqlite3-adapter.ts` (RFC 0106 wave-3a).

Rails' `InsertAll::Builder#touch_model_timestamps_unless`
(`vendor/rails/activerecord/lib/active_record/insert_all.rb:284`) emits each
timestamp assignment with a TRAILING comma and `.join`s them:

    "#{column_name}=(CASE WHEN (...) THEN #{model.quoted_table_name}.#{column_name} ELSE #{connection.high_precision_current_timestamp} END),"

That is why every adapter's `build_insert_sql` can concatenate the two fragments
directly (`sqlite3_adapter.rb:463-464`, and the same shape in
`postgresql_adapter.rb` / `abstract_mysql_adapter.rb`):

    sql << insert.touch_model_timestamps_unless { |column| "..." }
    sql << insert.updatable_columns.map { |column| "#{column}=excluded.#{column}" }.join(",")

trails' `packages/activerecord/src/insert-all.ts:742-765` builds the same parts
but returns `parts.join(",")` — no trailing separator. Every adapter therefore
compensates by collecting the two fragments into an array and joining, which is
a shape divergence in three `buildInsertSql` bodies rather than one builder.

## Acceptance criteria

- [ ] `touchModelTimestampsUnless` terminates each entry with `,` and
      concatenates, mirroring insert_all.rb:284.
- [ ] `buildInsertSql` in `sqlite3-adapter.ts`, `postgresql-adapter.ts` and
      `abstract-mysql-adapter.ts` concatenates the two fragments directly, as
      Rails does, and the compensating `assignments` array is deleted.
- [ ] `insert-all.test.ts` and the adapter upsert tests stay green on SQLite,
      PostgreSQL and MySQL/MariaDB.
