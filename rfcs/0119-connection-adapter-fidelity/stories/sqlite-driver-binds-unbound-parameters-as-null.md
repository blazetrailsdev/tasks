---
title: "sqlite-driver-binds-unbound-parameters-as-null"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Prerequisite for [[sqlite3-explain-passes-empty-binds]], which cannot converge
until this lands.

`SQLite3::DatabaseStatements#explain`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:18-21`)
is:

```ruby
def explain(arel, binds = [], _options = [])
  sql    = "EXPLAIN QUERY PLAN " + to_sql(arel, binds)
  result = internal_exec_query(sql, "EXPLAIN", [])
  SQLite3::ExplainPrettyPrinter.new.pp(result)
end
```

The third argument is `[]` while the SQL still carries its `?` placeholders —
Rails' own `test/cases/adapters/sqlite3/explain_test.rb:11` asserts exactly
that (`… WHERE "authors"."id" = (?:\? \[\["id", 1\]\]|1)`), and
`exec_explain` (`explain.rb:28`) hands `c.explain(sql, binds, options)` a
String plus its non-empty binds. So Rails runs the EXPLAIN with every
parameter left UNBOUND.

Verified against the sqlite3 gem on ruby 3.3.11:

```console
$ ruby -e 'require "sqlite3"; db=SQLite3::Database.new(":memory:")
  db.execute("create table t(a)"); db.execute("insert into t values(1)")
  p db.prepare("EXPLAIN QUERY PLAN SELECT * FROM t WHERE a = ?").execute.to_a[0]
  p db.prepare("SELECT a FROM t WHERE a IS ?").execute.to_a'
[2, 0, 216, "SCAN t"]
[]
```

The second line is the proof: `a IS ?` matches nothing against `a = 1`, so the
unbound parameter is NULL — `sqlite3_bind_*`'s documented default, which the
gem inherits from the C API by never calling them.

trails' driver wrappers do not inherit it. `better-sqlite3` adds its own arity
validation and raises `RangeError: Too few parameter values were provided`
(`packages/activerecord/src/sqlite/better-sqlite3.ts:37`, reached from
`connection-adapters/sqlite3/database-statements.ts:241`'s `stmt.all(binds)`).
So #7433 had to pass `binds` instead of `[]`, carrying
`@missingRailsArgs internal_exec_query — CONVERGEABLE sqlite3-explain-passes-empty-binds`.
Passing the literal `[]` reds nine tests in
`packages/activerecord/src/adapters/sqlite3/explain.test.ts` and
`packages/activerecord/src/explain.test.ts`.

## Converged shape

`SqliteStatement` (`packages/activerecord/src/sqlite-adapter.ts:18`) gains the
gem's tolerance: a bind list shorter than the statement's parameter count is
padded with `null` rather than rejected, in all four drivers —
`sqlite/better-sqlite3.ts`, `sqlite/node-sqlite.ts`, `sqlite/libsql.ts`,
`sqlite/expo-sqlite.ts`.

The obstacle to solve first: none of the four exposes a prepared statement's
parameter count, so the pad length has to come from somewhere sound. Counting
`?` by scanning the SQL text is NOT sound — it hits `?` inside string literals
and comments. Options worth costing before writing code:

- `better-sqlite3` may expose the count on the underlying handle; check the
  version pinned in `packages/activerecord/package.json` before assuming it
  does not.
- Otherwise reuse `stripSqlComments` / the adapter's existing SQL scanner
  rather than a fresh regex, and confine the pad to the EXPLAIN path so a
  short bind list stays an error for ordinary queries — a permissive pad
  everywhere would mask genuine bind-count bugs across the suite, which is the
  reason #7433 did not simply loosen the wrapper.

## Acceptance criteria

- [ ] A prepared statement executed with fewer binds than parameters binds the
      remainder NULL on every sqlite driver, matching the sqlite3 gem.
- [ ] A short bind list on an ordinary (non-EXPLAIN) query still raises, so the
      change does not hide bind-count bugs.
- [ ] `[[sqlite3-explain-passes-empty-binds]]` can then pass `[]` and delete the
      `@missingRailsArgs` receipt from
      `connection-adapters/sqlite3/database-statements.ts`.
- [ ] `packages/activerecord/src/adapters/sqlite3/explain.test.ts` and
      `packages/activerecord/src/explain.test.ts` pass unchanged.
