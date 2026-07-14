---
title: "Route schema reflection through unwrapped internal execute (drop SCHEMA name-check)"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4852 wired `dirties_query_cache` on the public `execQuery`/`execute` (Rails
query_cache.rb:13). trails reuses those same wrapped methods for schema
reflection (calling `execute(sql, binds, "SCHEMA")`), whereas Rails routes schema
reflection through the permanently-UNWRAPPED `internal_exec_query`
(vendor/rails activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:546-559),
so it never touches the dirtying path.

To reproduce Rails' "schema reflection never dirties the query cache" behavior
without converting every reflection call site, #4852 introduced a scoped
`dirtiesQueryCacheExceptSchema` wrapper
(packages/activerecord/src/connection-adapters/abstract/query-cache.ts) that
skips the clear when the query `name` is `"SCHEMA"`. This is a pragmatic
string-identity check standing in for what should be a structural distinction
(unwrapped internal method vs. wrapped public method).

The ~16 schema-reflection call sites currently use `this.execute(..., "SCHEMA")`:

- packages/activerecord/src/connection-adapters/sqlite3-adapter.ts (~12, e.g.
  `primaryKeys`/`columns`/index reflection PRAGMA reads)
- packages/activerecord/src/connection-adapters/postgresql-adapter.ts (~2)
- packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts (~2)
- packages/activerecord/src/connection-adapters/abstract-adapter.ts `schemaQuery`
  (execute.call(this, sql, binds, "SCHEMA"))
- packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts (~3)

## Acceptance criteria

- [ ] Route schema reflection through an unwrapped internal execute path
      (an `internalExecute`/`internalExecQuery` sibling that `dirties_query_cache`
      never wraps), mirroring Rails' `internal_exec_query(sql, "SCHEMA")`.
- [ ] Remove the `dirtiesQueryCacheExceptSchema` string-check for `"SCHEMA"`
      (and its scoped wrapper) — `execute`/`execQuery` can then dirty
      unconditionally like the write methods.
- [ ] No regression in `query-cache.test.ts` (esp. `query cached even when types
  are reset`, which depends on schema reflection not evicting the cache).
