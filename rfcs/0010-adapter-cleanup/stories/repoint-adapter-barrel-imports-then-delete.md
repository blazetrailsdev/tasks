---
title: "repoint-adapter-barrel-imports-then-delete"
status: ready
updated: 2026-06-29
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up (b) to `converge-abstractadapter-superset-then-delete-barrel`. PR (a)
made `AbstractAdapter` a genuine type superset of the deleted-target
`DatabaseAdapter` interface surface — it now declares the previously-missing
optional members `explain?`, `createTableDefinition?`, `schemaCreation?`
(alongside the pre-existing `changeTableComment?` / `createAlterTable?`) in the
declaration-merge `interface AbstractAdapter` in
`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, and
documented the `adapterName` typing decision: base getter stays `string`
(Rails-faithful "Abstract"); concrete adapters override to `AdapterName`;
downstream narrowing sites narrow/guard at the call site (do NOT force the
narrow type onto the base getter).

This (b) story does the mechanical-but-large repoint + delete:

- ~76 files import from `adapter.js` (some import only re-exports like
  `AdapterName` / `ExplainOption` / `*AdapterOptions`, others import the
  `DatabaseAdapter` type). Repoint each:
  - `DatabaseAdapter` type → `AbstractAdapter` (from
    `connection-adapters/abstract-adapter.js`); keep a public
    `DatabaseAdapter` alias export in `index.ts` if trailties/dx-tests still
    need it.
  - re-exports (`AdapterName`, `adapterNameFromConfig`, `ExplainOption`,
    `inspectExplainOption`, `TrailsAdapterOptions`, `SQLite3AdapterOptions`,
    `MysqlAdapterOptions`, `PostgreSQLAdapterOptions`) → import directly from
    their real homes (`abstract-adapter.js`, `abstract/database-statements.js`,
    `pool-config.js`).
- Inline dynamic type imports `import("../adapter.js")` in
  `tasks/database-tasks.ts` (8 sites) and `migrator.test.ts:1021`.
- Two interfaces `extends DatabaseAdapter`: `TransactionAwareConnection`
  (`connection-adapters/abstract/connection-pool.ts:38`) and
  `TransactionConnection` (`connection-adapters/abstract/transaction.ts:291`).
  Extending the `AbstractAdapter` class yields TS2430 (28 private/protected
  members) — instead define the structural surface they actually need, or keep
  a slim structural interface they extend.
- ~6 adapterName-narrowing sites (type.ts:122, insert-all.ts:157,
  migration.ts:255/1749, define-fixtures.ts:232, schema-statements.ts:207/1464)
  — narrow/guard since base is now `string`.
- Cross-package public consumers: `packages/trailties/src/{database,
schema-source,commands/db}.ts` and
  `packages/activerecord/dx-tests/edge-cases.test-d.ts`.
- Delete `packages/activerecord/src/adapter.ts` + the `DatabaseAdapter`
  interface; `index.ts` forwards from real sources.

## Acceptance criteria

- [ ] All `adapter.js` import sites repointed; `grep -rnE "adapter(\.js)?['\"]"`
      and `grep -rn 'import(.*adapter\.js'` return zero non-self hits.
- [ ] `packages/activerecord/src/adapter.ts` deleted; `index.ts` forwards from
      real sources (public `DatabaseAdapter` alias kept iff still consumed).
- [ ] Two `extends DatabaseAdapter` interfaces resolved (no TS2430).
- [ ] ~6 adapterName-narrowing sites guard/narrow at call site.
- [ ] `pnpm exec tsc -b packages/activerecord` AND trailties typecheck at 0
      errors.
- [ ] May exceed 500 LOC (deleting adapter.ts is ~470 deletions). If so, split
      the repoint by package/dir into non-overlapping PRs from main (NOT
      stacked) — e.g. one PR for the `DatabaseAdapter`→`AbstractAdapter` type
      repoint + interface resolution, a separate PR for the re-export repoints + final `adapter.ts` deletion once nothing imports it.
