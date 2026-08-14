---
title: "Abstract execQuery forwards prepare, retiring the three adapter exec_query overrides Rails lacks"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6548
claim: "2026-08-14T22:42:14Z"
assignee: "abstract-exec-query-forwards-prepare-drop-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

Rails' abstract `exec_query` forwards the `prepare:` kwarg:

```ruby
def exec_query(sql, name = "SQL", binds = [], prepare: false)
  internal_exec_query(sql, name, binds, prepare: prepare)
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:147-149`).

trails' abstract `execQuery`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:583-595`)
takes only `(sql, name, binds)` and calls
`run(sql, name, binds)` — the `prepare` argument is dropped on the floor.

Because of that, all three concrete adapters carry an `exec_query` override
that Rails does NOT have, existing only to thread the options object through:

- `sqlite3-adapter.ts` (`execQuery` → `internalExecQuery(sql, name, binds, options)`)
- `postgresql-adapter.ts:1092`
- `mysql2-adapter.ts:632`

Rails has no `exec_query` def in `sqlite3/database_statements.rb`,
`postgresql/database_statements.rb`, or `mysql/database_statements.rb`. The
overrides are pure trails invention created by the abstract method's dropped
argument. Surfaced while converging `internal_exec_query` in PR #6544.

## Converged shape

Give the abstract `execQuery` the fourth parameter Rails has and forward it:

```ts
export function execQuery(
  this: DatabaseStatementsHost | void,
  sql: string,
  name: string | null = "SQL",
  binds: unknown[] = [],
  options: { prepare?: boolean } = {},
): Promise<Result> {
  const run = (...).bind(...);
  return run(sql, name, binds, options);
}
```

then delete the three adapter `execQuery` overrides, since each becomes a
byte-for-byte re-declaration of the inherited body.

## Acceptance criteria

1. Abstract `execQuery` forwards `prepare` to `internalExecQuery`, mirroring
   `abstract/database_statements.rb:147-149`.
2. The `execQuery` overrides in `sqlite3-adapter.ts`, `postgresql-adapter.ts`
   and `mysql2-adapter.ts` are deleted — Rails has no counterpart for any of
   them.
3. `pnpm parity:api:extra --package activerecord` loses the three names;
   `parity:api:calls` / `parity:api:calls:args` non-negative.
