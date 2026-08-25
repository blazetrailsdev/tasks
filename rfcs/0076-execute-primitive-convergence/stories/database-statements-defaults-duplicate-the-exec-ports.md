---
title: "Point the DatabaseStatements defaults at the ported execInsert/execDelete/execUpdate"
status: draft
updated: 2026-08-15
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
holds TWO implementations of `exec_insert` / `exec_delete` / `exec_update`:

- the faithful ports — `export function execInsert` (`:603`), `execDelete`
  (`:678`), `execUpdate` (`:695`) — which do call `sqlForInsert` /
  `internalExecQuery` / `internalExecute` / `affectedRows` as
  `abstract/database_statements.rb:157-170`, `:186-188`, `:191-193` do; and
- the `DatabaseStatements` defaults object (`:1608`), whose `execInsert` (`:1733`),
  `execDelete` (`:1745`) and `execUpdate` (`:1754`) are each a bare
  `return this.executeMutation(sql, binds, name)`.

`include(AbstractAdapter, DatabaseStatements)` maps the defaults object's members
onto `connection-adapters/abstract-adapter.ts`, so the defaults — not the ports —
are what the call recorder compares against Rails. That produces the 6
permanently-red rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-adapter.json`
(`exec_insert` missing `sql_for_insert` + `internal_exec_query`; `exec_delete`
and `exec_update` each missing `internal_execute` + `affected_rows`).

Those rows were previously believed to be a call-recorder artifact — the story
`call-recorder-matches-bodiless-interface-declarations` (RFC 0106) was filed to
teach the extractor to skip bodiless members. It was BLOCKED with the measurement:
a sweep of all 1196 rows in `output/call-mismatches.json` against
`output/ts-api.json` finds ZERO rows whose matched TS member is bodiless-only
(the extractor already records no `calls` key for `MethodSignature` /
`PropertySignature`, `extract-ts-api.ts:2318-2337`, and `compare.ts:2734` returns
early on an empty candidate set). The rows are real body divergence, and they
belong here.

## Converged shape

The defaults object references the ported functions instead of re-implementing
them — the shape it already uses for `resetTransaction` and
`insert: insertStatement`:

```ts
export const DatabaseStatements = {
  ...
  execInsert,
  execDelete,
  execUpdate,
  ...
};
```

This is a BEHAVIORAL change, which is why it is sized as adapter work rather than
a rename: the default `execInsert` currently returns a row count from
`executeMutation` and would return a `Result` from `internalExecQuery`, and
`execDelete` / `execUpdate` would route through `internalExecute` + `affectedRows`
instead of `executeMutation`. Every adapter that inherits a default rather than
overriding it is affected, so it needs the full three-adapter suite.

## Acceptance criteria

- [ ] `DatabaseStatements`' `execInsert` / `execDelete` / `execUpdate` entries
      reference the ported functions; the duplicate bodies are deleted.
- [ ] The 6 rows are deleted from
      `call-mismatches-exclude/activerecord/connection-adapters/abstract-adapter.json`
      and the mark tightened (no reseed).
- [ ] `pnpm parity:api:calls` green; in-scope count falls and does not rise.
- [ ] Full AR suite green on sqlite3, postgresql and mysql2.
