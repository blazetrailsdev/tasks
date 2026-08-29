---
title: "param-drift-execute-binds-slot-family-convergence"
status: ready
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param-drift-abstract-adapters-remaining-shape-rows` cleared the
`checkConstraintExists` row but left the two `execute` rows, because they are
not a rename — they are the whole adapter family's signature.

`API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params`:

```
connection-adapters/abstract/database-statements.ts:execute  @1  ruby `name`  ts `binds`
connection-adapters/abstract/database-statements.ts:execute  @2  ruby `allowRetry`  ts `name`
```

Rails is `execute(sql, name = nil, allow_retry: false)` delegating to
`internal_execute(sql, name, allow_retry: allow_retry)`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:136-138`).

trails carries a `binds` slot at @1 across the whole family, and the standalone
`execute` is a throwing stub rather than a delegation:

- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:316`
  — `execute(_sql, _binds?, _name?)` throwing "must be implemented by adapter
  subclass";
- `DatabaseStatementsHost.execute` (`:76`) and
  `DatabaseStatementsDefaultsHost.execute` (`:843`) declare the same 4-slot
  shape;
- `connection-adapters/abstract-adapter.ts:622`;
- `sqlite3-adapter.ts:314`, `postgresql-adapter.ts:867`, `mysql2-adapter.ts:474`
  each implement `execute(sql, binds = [], name = "SQL", { allowRetry })` with
  their own `log` + `performQuery` body instead of routing through
  `internalExecute` → `rawExecute`;
- in-file callers pass the empty binds explicitly —
  `(this.execute ?? execute).call(this, sql, [], name)` at `:345`, `:636`,
  `:805`, where Rails' `truncate` / `insert_fixture` are
  `execute(sql, name)` (`database_statements.rb:280`, `:365`).

That is a behavioural refactor of three concrete adapters plus ~124 `.execute(`
call sites, so it did not fit the shape-rows story's 180 LOC and its explicit
"no behaviour change" criterion.

## Acceptance criteria

- Standalone `execute` mirrors `database_statements.rb:136` — `(sql, name = null,
{ allowRetry = false } = {})` — and delegates to `internalExecute` rather than
  throwing.
- The `binds` slot is gone from `DatabaseStatementsHost`,
  `DatabaseStatementsDefaultsHost`, `AbstractAdapter` and the three concrete
  adapters; bound values route the way Rails routes them (`exec_query` /
  `internal_exec_query`).
- `pnpm parity:api --package activerecord --params` reports no `execute` rows
  for `connection_adapters/abstract*`.
- `parity:api` methods/arity unmoved; `parity:api:calls`,
  `parity:api:calls:args`, `parity:api:extra:gate` gain no row.
