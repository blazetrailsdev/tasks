---
title: "SQLite's ported write_query? is unwired; checkIfWriteQuery uses the sql-classification helper instead"
status: done
updated: 2026-09-06
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7563
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' SQLite adapter defines its own `write_query?` over a SQLite-specific
`READ_QUERY` regexp — `DEFAULT_READ_QUERY` plus `:pragma`
(`activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:7-14`):

```ruby
READ_QUERY = ActiveRecord::ConnectionAdapters::AbstractAdapter.build_read_query_regexp(
  :begin, :commit, :explain, :select, :pragma, :release, :savepoint, :rollback, :with
)

def write_query?(sql) # :nodoc:
  !READ_QUERY.match?(sql)
end
```

trails HAS that port, faithfully, at the Rails path and name:
`isWriteQuery` in `packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts:42`,
over the `READ_QUERY` constant declared just above it (`:19-21`), whose comment
already records that it mirrors `build_read_query_regexp(:pragma)`.

**Nothing calls it.** `SQLite3Adapter` never wires `isWriteQuery` onto the
prototype; `preprocessQuery` -> `checkIfWriteQuery` reaches
`isWriteQuerySql` imported from `connection-adapters/sql-classification.ts`
instead (`sqlite3-adapter.ts:90`, used at `:547`). Verified on main
2026-08-10: a repo-wide grep for the export finds the declaration and no
consumer.

Surfaced while converging `_performQuery` (PR #6299): that body used to call
`this.isWriteQuery(sql)`, and dropping the call — which Rails' `perform_query`
also does not make — left the port with zero callers, making the gap visible.

The two are not obviously equivalent, which is the risk: the shared
`sql-classification` helper is a trails invention with its own dialect-neutral
notion of a read, so SQLite's `:pragma` arm is only correct here by
coincidence of the two lists agreeing today. A divergence between them would
silently mis-gate `preventing_writes?`.

## Converged shape

Wire the ported `isWriteQuery` onto `SQLite3Adapter.prototype` the way the
other `sqlite3/database-statements.ts` members are wired, so
`checkIfWriteQuery` dispatches through the virtual method Rails overrides
(`abstract_adapter.rb`'s `write_query?` + the SQLite override). Then either
drop the `isWriteQuerySql` import from `sqlite3-adapter.ts`, or — if other
adapters still need the shared helper — confirm each of those has its own
Rails counterpart and is wired the same way.

Do NOT resolve this by deleting the port: `write_query?` is a real Rails
method in a Rails-matched file and `parity:api` credits it.

## Acceptance criteria

- [ ] `SQLite3Adapter` wires `isWriteQuery` from `sqlite3/database-statements.ts`,
      and `checkIfWriteQuery` on SQLite dispatches through it.
- [ ] The port has at least one production caller; `sql-classification`'s
      `isWriteQuerySql` is no longer consulted on the SQLite path.
- [ ] A test pins the `:pragma` arm — `PRAGMA foreign_keys` is a read,
      `PRAGMA foreign_keys = OFF` is a write — through the public
      `whilePreventingWrites` guard.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra --package activerecord` stay green.
