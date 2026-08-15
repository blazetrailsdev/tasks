---
title: 'Retire schemaQuery in favour of internalExecQuery(sql, "SCHEMA")'
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6574
claim: "2026-08-15T18:45:04Z"
assignee: "find-each-no-block-enumerator-size-arm"
blocked-by: null
closed-reason: null
---

# Retire `schemaQuery` in favour of `internalExecQuery(sql, "SCHEMA")`

## Context

Surfaced converging the `table_info` and `foreign_keys` call-set rows on
`connection-adapters/sqlite3-adapter.ts` in PR #6567 (RFC 0106 wave-3a). Both
rows had to stay baselined, with a reviewed reason, purely because of a NAME.

Rails spells every schema-reflection read as `internal_exec_query(sql, "SCHEMA")`:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:792-794`
  (`table_info`) — `internal_exec_query("PRAGMA table_xinfo(...)", "SCHEMA")`
- `vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:419`
  (`foreign_keys`) — `internal_exec_query("PRAGMA foreign_key_list(...)", "SCHEMA")`
- the same shape throughout `abstract/schema_statements.rb`, `postgresql_adapter.rb`
  and `abstract_mysql_adapter.rb`

trails has `AbstractAdapter#schemaQuery(sql, binds)`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1137`), which
IS that call — it routes the pre-`dirtiesQueryCache` unwrapped `execute` under the
`"SCHEMA"` name. It was introduced by story
`schema-reflection-via-unwrapped-internal-execute` (PR #4977), which is done; what
remains is that the name has no Ruby counterpart, so `parity:api:calls` cannot see
through it and every reflection call site reads as an omitted `internal_exec_query`.

Measured at the time of filing: **10 baselined `internal_exec_query` rows across 7
shards**, and **56 `schemaQuery` call sites** in `packages/activerecord/src`.
The same rows are in scope for `wave-3b-abstract-mysql-adapter` and
`wave-3c-postgresql-adapter`, so converging this once retires rows in all three.

## Converged shape

Reflection call sites read `internalExecQuery(sql, "SCHEMA")` directly. The two
implementations already differ only in return type — `schemaQuery` hands back
plain rows, `internalExecQuery` a `Result` — so the work is per-call-site row
access, not a behavioural change. Either retire `schemaQuery` entirely, or keep it
as a private spelling that the comparator is taught to resolve; retiring it is the
faithful option, since Rails has no such member.

## Acceptance criteria

- [ ] Schema-reflection reads call `internalExecQuery(sql, "SCHEMA")`, not
      `schemaQuery`, so the call-set comparator matches Rails' call.
- [ ] `schemaQuery` is deleted (or reduced to a non-public alias with no
      reflection call sites left on it).
- [ ] The 10 `internal_exec_query` rows are deleted by hand from their shards
      (no `--write`, no reseed); stale marks fixed with `parity:api:calls:tighten`.
- [ ] Reflection still never dirties the query cache — the `"SCHEMA"` name stays
      load-bearing for `LogSubscriber` / `ExplainSubscriber` filtering and for
      `assertQueries` counts.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
