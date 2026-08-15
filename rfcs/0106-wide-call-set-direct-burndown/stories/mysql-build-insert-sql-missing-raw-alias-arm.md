---
title: "build_insert_sql omits the supports_insert_raw_alias_syntax? arm, emitting SQL deprecated since MySQL 8.0.20"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6580
claim: "2026-08-15T22:15:06Z"
assignee: "mysql-build-insert-sql-missing-raw-alias-arm"
blocked-by: null
closed-reason: null
---

## Context

Baselined in PR #6577 (RFC 0106 wave 3b) with a reviewed reason; the rows are
`build_insert_sql | table_name` and `build_insert_sql | quote_table_name` in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`.

`abstract_mysql_adapter.rb:638-682` has TWO arms. trails ports only the second:

    if supports_insert_raw_alias_syntax?
      quoted_table_name = insert.model.quoted_table_name
      values_alias = quote_table_name("#{insert.model.table_name.parameterize}_values")
      sql = +"INSERT #{insert.into} #{insert.values_list} AS #{values_alias}"

      if insert.skip_duplicates?
        if no_op_column
          sql << " ON DUPLICATE KEY UPDATE #{no_op_column}=#{quoted_table_name}.#{no_op_column}"
        end
      elsif insert.update_duplicates?
        ...
        sql << insert.touch_model_timestamps_unless { |column| "#{quoted_table_name}.#{column}<=>#{values_alias}.#{column}" }
        sql << insert.updatable_columns.map { |column| "#{column}=#{values_alias}.#{column}" }.join(",")
      end
    else
      # the legacy VALUES(<expr>) form — the only arm trails emits
    end

`supports_insert_raw_alias_syntax?` is `!mariadb? && database_version >= "8.0.19"`
(rb:892-894). MySQL 8.0.20 DEPRECATES the `VALUES(<expression>)` form trails
always emits (<https://dev.mysql.com/worklog/task/?id=13325>), so on a modern
MySQL 8 server every `insert_all`/`upsert_all` with `update_duplicates` emits
deprecated SQL and logs a server-side warning.

**Why it was baselined rather than converged:** the arm is selected by an async
predicate (`supportsInsertRawAliasSyntax()` reads `databaseVersion`), while
`buildInsertSql(insert: InsertBuilder): string` is a synchronous adapter hook
(`abstract-mysql-adapter.ts:1099`). Every dialect implements it synchronously
and `insert-all.ts` calls it synchronously.

## Converged shape

Both Rails arms present, selected by `supports_insert_raw_alias_syntax?`. The
likely route is making `buildInsertSql` async across all three dialects (PG,
SQLite, MySQL) and awaiting at the `insert-all.ts` call site — the version
lookup is already memoized on the pool, so the await is cheap. Confirm no
synchronous caller remains before flipping.

Note the trap that bit PR #6577: an async callee interpolated into a template
literal is a well-typed `string` that stringifies to `[object Promise]`, and
`tsc` will not catch it. Verify on a live MySQL 8 (not just MariaDB — the arm
is `!mariadb?`, so MariaDB never exercises it).

## Acceptance criteria

- [ ] `buildInsertSql` mirrors rb:638-682 including the raw-alias arm, same
      branch order and same guards.
- [ ] `AS <values_alias>`, the `quoted_table_name.column` skip-duplicates form
      and the `<=>` touch form all emitted on MySQL >= 8.0.19.
- [ ] MariaDB still takes the legacy arm.
- [ ] The two `build_insert_sql` rows deleted by hand from the shard (no reseed).
- [ ] A regression test that FAILS on baseline, exercised on the MySQL 8 lane.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
