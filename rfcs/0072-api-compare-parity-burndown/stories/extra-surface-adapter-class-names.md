---
title: "Decide the novel adapter and nested class names across the connection-adapters tree"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5927
claim: "2026-08-02T22:35:46Z"
assignee: "extra-surface-adapter-class-names"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `extra-surface-adapter-per-file-singletons` (PR #5918).
With that story's members resolved, the _only_ novel surface left on most
adapter files is the exported CLASS name itself. `pnpm parity:api:extra --package
activerecord --json` reports one novel name per file for:

- `connection-adapters/better-sqlite3-adapter.ts` — `BetterSQLite3Adapter`
- `connection-adapters/expo-sqlite-adapter.ts` — `ExpoSQLiteAdapter`
- `connection-adapters/libsql-adapter.ts` — `LibSQLAdapter`
- `connection-adapters/libsql-remote-adapter.ts` — `LibSQLRemoteAdapter`
- `connection-adapters/libsql-replica-adapter.ts` — `LibSQLReplicaAdapter`
- `connection-adapters/node-sqlite-adapter.ts` — `NodeSQLiteAdapter`

and, mixed in with other names, `AbstractSQLite3Adapter` / `SQLite3IntegerType`
/ `SQLiteDateTimeType` on `connection-adapters/sqlite3-adapter.ts` plus
`PostgreSQLSchemaStatements` on
`connection-adapters/postgresql/schema-statements-class.ts`.

These split into two genuinely different cases and the story must decide each
on its own evidence:

1. **Driver variants Rails does not have.** Ruby binds one gem per adapter, so
   `sqlite3_adapter.rb` declares exactly `SQLite3Adapter` — there is no Rails
   class for better-sqlite3 / expo / libsql / node:sqlite to map onto. These are
   the strongest `@noRailsEquivalent PERMANENT` candidates in the tree.
2. **Renamed ports of classes Rails DOES declare.** `SQLite3IntegerType`
   corresponds to `SQLite3Integer` (sqlite3_adapter.rb:486) and
   `PostgreSQLSchemaStatements` to `PostgreSQL::SchemaStatements`
   (postgresql/schema_statements.rb) — the `Type` suffix and the flattened name
   are trails inventions, so the fidelity move is a rename, not a tag. Note PR
   #5918 already deleted a dead duplicate class literally named `SQLite3Integer`
   from `sqlite3-adapter.ts`, which frees that name for the real type.
   `AbstractSQLite3Adapter` needs the same check against `SQLite3Adapter` and
   the trails inheritance layout before it is tagged.

Reproduce with `pnpm parity:api && pnpm parity:api:extra --package activerecord --json`.

## Acceptance criteria

- One recorded decision per class name above, with case (2) renames attempted
  before any tag is written — a tag on a class Rails actually declares is the
  outcome this story exists to prevent.
- Any `@noRailsEquivalent` reason is anchored to a vendored Rails `file:line`
  and states PERMANENT or CONVERGEABLE; justifications live at the declaration
  site.
- Novel counts for the listed files drop to 0 except for names owned by other
  stories; `pnpm parity:api:extra` reports no STALE entries.
- A rename must not regress `pnpm parity:api` or `pnpm parity:test` totals —
  record both deltas in the PR body.
- Scoped `pnpm vitest run` on the touched adapter/driver test files passes.
