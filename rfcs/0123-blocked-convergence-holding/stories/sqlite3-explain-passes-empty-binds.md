---
title: "sqlite3-explain-passes-empty-binds"
status: blocked
updated: 2026-09-03
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: "2026-09-03T15:51:19Z"
assignee: "converge-future-result-event-buffer-instrument"
blocked-by: "Story premise is wrong: Rails' ExplainSubscriber stores payload[:sql] as a STRING with placeholders (explain_subscriber.rb:14), and to_sql returns a String arel unchanged, so MRI also reaches sqlite3's internal_exec_query with '?' placeholders and []. Verified with real ruby that the sqlite3 C driver leaves unbound parameters NULL and the EXPLAIN succeeds; better-sqlite3 raises RangeError 'Too few parameter values were provided' instead. The divergence is driver tolerance, not the caller, and better-sqlite3 exposes no parameter-count API to pad the bind list with NULLs the way sqlite3 does. Needs a driver-shim story (unbound->NULL) before the seat can pass []."
closed-reason: null
---

## Context

`SQLite3::DatabaseStatements#explain` is
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:18`:

```ruby
def explain(arel, binds = [], _options = [])
  sql    = "EXPLAIN QUERY PLAN " + to_sql(arel, binds)
  result = internal_exec_query(sql, "EXPLAIN", [])
  SQLite3::ExplainPrettyPrinter.new.pp(result)
end
```

The third argument is `[]`, NOT `binds` — sqlite3 is the odd one out here, since
`postgresql/database_statements.rb`'s `explain` passes `binds` through.

`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`'s
port passes `binds`. #7433 tried the literal `[]` and nine tests in
`adapters/sqlite3/explain.test.ts` and `explain.test.ts` failed with
`StatementInvalid: Too few parameter values were provided`, so it was reverted.

The cause is upstream of `explain`: trails' `toSql` (`abstract/database-statements.ts:178`)
returns a String arel unchanged, placeholders and all, and trails'
`execExplain` hands `explain` a String plus its binds. In Rails the
`ExplainSubscriber` path reaches `explain` with an Arel AST, which `to_sql`
renders with the values inlined, so the empty binds array is never short.

So the convergence is in the caller, not in `explain`: make trails' explain
path render its SQL before it reaches the adapter, then the seat can pass `[]`.

## Acceptance criteria

- [ ] `sqlite3/database-statements.ts`'s `explain` passes `[]` as
      `internal_exec_query`'s third argument, matching `database_statements.rb:20`.
- [ ] `packages/activerecord/src/adapters/sqlite3/explain.test.ts` and
      `packages/activerecord/src/explain.test.ts` pass unchanged.
- [ ] `pnpm parity:api:calls:args` clean, with no new baseline row.
