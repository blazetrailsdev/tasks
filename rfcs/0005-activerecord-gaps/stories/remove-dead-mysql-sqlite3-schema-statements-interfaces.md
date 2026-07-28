---
title: "Remove the dead MySQL and SQLite3 SchemaStatements interfaces"
status: done
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5513
claim: "2026-07-28T15:13:48Z"
assignee: "remove-dead-mysql-sqlite3-schema-statements-interfaces"
blocked-by: null
closed-reason: null
---

## Context

PR #5510 deleted the dead `export interface SchemaStatements` from
`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`
(unimported structural mirror; the live contract is
`PostgreSQLSchemaStatements extends SchemaStatements` from
`../abstract/schema-statements.js`, a distinct symbol sharing the name).

The same dead-interface pattern exists in both sibling adapters and was left
untouched by that PR:

- `connection-adapters/mysql/schema-statements.ts:104` — `export interface SchemaStatements` (file is 802 lines)
- `connection-adapters/sqlite3/schema-statements.ts:20` — `export interface SchemaStatements` (file is 380 lines)

Neither is imported anywhere: `grep -rn "SchemaStatements" packages/activerecord/src --include=*.ts`
filtered to `mysql/schema-statements.js` / `sqlite3/schema-statements.js`
importers returns nothing. Rails has no interface counterpart either — its
`Mysql2::SchemaStatements` / `SQLite3::SchemaStatements` are modules mixed into
the adapter, which trails already models as classes. Because they are
unenforced, they carry the same silent-drift risk that motivated #5510 (the PG
one still declared pre-widening `validateForeignKey`/`validateCheckConstraint`
shapes).

Note both files also export live option/definition types alongside the dead
interface (that is why `mysql/schema-creation.ts` and the `*.test.ts` files
import from them) — those must stay exported.

## Acceptance criteria

- [ ] `export interface SchemaStatements` deleted from
      `mysql/schema-statements.ts` and `sqlite3/schema-statements.ts`, along
      with the top-of-file type imports only it used (verify each is genuinely
      unused first).
- [ ] All other exports of both modules stay exported; their existing importers
      keep compiling.
- [ ] Audit each declared member against the real class/adapter before
      deleting; if any declaration describes behaviour that is NOT implemented,
      register that gap as its own story rather than preserving the
      declaration.
- [ ] `pnpm typecheck` clean; `pnpm api:compare` shows no new extra/missing
      surface.
- [ ] Green on all three adapters.
