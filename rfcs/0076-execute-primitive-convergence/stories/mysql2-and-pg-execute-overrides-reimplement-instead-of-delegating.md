---
title: "Mysql2Adapter#execute should not exist and PostgreSQLAdapter#execute should be super plus its ensure"
status: draft
updated: 2026-08-30
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7225 (RFC 0128 `execute` param-drift convergence).

That PR converged `SQLite3Adapter#execute` onto its Rails shape: Rails'
`sqlite3/database_statements.rb:53` is

```ruby
def execute(...) # :nodoc:
  # SQLite3Adapter was refactored to use ActiveRecord::Result internally
  # but for backward compatibility we have to keep returning arrays of hashes here
  super&.to_a
end
```

so trails' override now delegates to the base `execute` and returns
`toArray()`, instead of reimplementing `log` + `performQuery` inline. The other
two adapters were left as-is, because that PR was a signature convergence and
this is a body rewrite.

Both remaining overrides reimplement the base body rather than delegating:

- **`Mysql2Adapter#execute`** (`connection-adapters/mysql2-adapter.ts:478`) —
  Rails has **no** `execute` override for mysql2 at all. Neither
  `mysql2_adapter.rb` nor `abstract_mysql_adapter.rb` defines one; mysql2 gets
  the base `execute` (`abstract/database_statements.rb:136-138`) unchanged. The
  trails override should be deleted outright, not rewritten.
- **`PostgreSQLAdapter#execute`** (`connection-adapters/postgresql-adapter.ts:867`) —
  Rails' `postgresql/database_statements.rb:39` is
  `def execute(...) ; super ; ensure @notice_receiver_sql_warnings = [] ; end`.
  trails duplicates the whole `log` + `withRawConnection` + `_performQuery`
  body just to reach the same `finally`. It should be `super` plus the
  `finally`, exactly as sqlite3 now is.

Deleting the mysql2 override changes its return type from
`Record<string, unknown>[]` to whatever the base returns, so this story is a
behavioural change with call-site fallout — which is why it did not fit in
#7225.

Related but distinct: `route-adapters-through-raw-execute` covers the
`internalExecute` / `internalExecQuery` overrides bypassing `rawExecute`. This
story is about the public `execute` override specifically.

## Acceptance criteria

- `Mysql2Adapter#execute` is deleted; mysql2 inherits the base `execute`,
  matching Rails having no override.
- `PostgreSQLAdapter#execute` is `super` + the
  `_noticeReceiverSqlWarnings = []` cleanup, mirroring
  `postgresql/database_statements.rb:39` — no duplicated `log`/`performQuery`
  body.
- `dirtiesQueryCache(...,"execute")` wiring still applies to both adapters.
- Callers that relied on the mysql2 override's array-of-hashes return are
  updated; PG and MariaDB lanes green.
- `parity:api:extra` loses the mysql2 `execute` name; `parity:api:calls` gains
  no row.
