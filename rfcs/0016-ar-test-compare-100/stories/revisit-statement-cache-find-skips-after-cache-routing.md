---
title: "Populate + introspect the connection statement pool so bind_parameter statement-cache tests pass"
status: ready
updated: 2026-06-16
rfc: "0016-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 250
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Six `it.skip` tests in `packages/activerecord/src/bind-parameter.test.ts`
(`statement cache`, `statement cache with query cache`, `statement cache with
find`, `statement cache with find by`, `statement cache with in clause`,
`statement cache with sql string literal`) mirror Rails
`bind_parameter_test.rb`'s statement-cache family. Each asserts against the
**connection-level** statement pool via Rails' helpers:

- `statement_cache` → `@connection.instance_variable_get(:@statements).send(:cache)`
- `to_sql_key(arel)` → `@connection.to_sql(arel)` then `@connection.send(:sql_key, sql)`

Triage during RFC 0030 story `e1-bind-parameter` (2026-06-16) established the
real blocker empirically — it is larger than the "introspection accessor"
framing this story originally carried:

1. **The connection pool is never populated by any query path.** Running
   `Topic.where({id:1}).toArray()`, `Topic.find(1)`, and `Topic.findBy({id:1})`
   all leave `sqlite3Adapter._statementPool` empty (`pool.keys === []`) even with
   `preparedStatements === true`. trails inlines bind values into the SQL string
   and executes through a non-pooled path; `_cachedStatement`
   (`connection-adapters/sqlite3-adapter.ts:357`) is the only thing that calls
   `_statementPool.set`, and the relation/find execution paths don't route
   through it for these SELECTs.
2. **`to_sql` inlines binds**, so `to_sql_key(arel)` yields
   `... WHERE "topics"."id" = 1`, never the placeholder form
   (`... = ?`) that a prepared-statement pool would be keyed by
   (`connection-adapters/abstract/database-statements.ts:184-211`, esp. the
   inline branch at 197-208).
3. **No `sqlKey` accessor on the abstract/sqlite adapter.** PG has one
   (`connection-adapters/postgresql-adapter.ts:1264`); sqlite keys the pool by
   raw SQL and exposes no `sqlKey`. The `StatementPool#cache` introspection
   accessor itself already exists
   (`connection-adapters/statement-pool.ts:135`, plus `pool.keys`), so that half
   of the original "f9 follow-up" is done — what's missing is population + keying.

`f9-statement-cache-pool-introspection` (this RFC, PR #3235, `done`) added the
`cache()` accessor and find-through-`cachedFindByStatement` routing but did NOT
wire prepared-statement pool population for query execution, which is why these
skips survived. The e1 skip comments were re-pointed at this story (the closed f9
reference was orphaned).

Note `Topic.find` / `findBy` DO populate the **per-class** `_findByStatementCache`
(`core.ts:563` `cachedFindByStatement`, called from the find fast-path at
`core.ts:707/905`) — so the `cached_statement(klass, key)` half of the
find/find_by tests is satisfiable; the `assert_includes statement_cache, ...`
half is what's blocked on the connection pool.

Rails refs: `bind_parameter_test.rb` (`test_statement_cache*`, and the
`statement_cache` / `to_sql_key` / `cached_statement` private helpers ll.
260-274), `core.rb:267,404`.

## Acceptance criteria

- Prepared-statement query execution populates the connection `_statementPool`
  for `where`/`find`/`find_by` SELECTs when `prepared_statements` is on, keyed the
  way Rails keys it (placeholder SQL via `sql_key`), so pool introspection
  observes the executed statement.
- Add a `sqlKey` accessor on the abstract adapter (sqlite: identity over the SQL;
  PG already has one) so a test helper can mirror Rails'
  `@connection.respond_to?(:sql_key) ? sql_key(sql) : sql`.
- Un-skip the six `statement cache*` tests in `bind-parameter.test.ts` and make
  them pass against canonical SQLite (and PG/MySQL where the `prepared_statements`
  gate applies — the Rails class is wrapped in `if prepared_statements`). The
  `assert_not_includes` cases (`in clause`) must pass for the right reason (the
  IN-clause query is genuinely not prepared/cached), not vacuously because the
  pool is always empty.
- Test names unchanged (test:compare matching). No stubs. No forcing green.
- If `to_sql` honoring placeholder mode proves too broad a blast radius for one
  PR, split the `to_sql`/visitor change from the pool-population wiring into
  sibling stories from `main` (non-overlapping files) — do not stack.
