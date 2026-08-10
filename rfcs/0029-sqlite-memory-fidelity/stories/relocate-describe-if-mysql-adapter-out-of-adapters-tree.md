---
title: "Relocate describeIfMysqlAdapter out of the MySQL adapter test-helper tree"
status: done
updated: 2026-07-29
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5553
claim: "2026-07-29T00:35:45Z"
assignee: "relocate-describe-if-mysql-adapter-out-of-adapters-tree"
blocked-by: null
closed-reason: null
---

## Context

PR #5536 moved `describeIfSqlite` to `support/describe-if-sqlite.ts`; PR #5540 did the
same for `describeIfPg` (`packages/activerecord/src/support/describe-if-pg.ts`). The
MySQL half of #5540 dissolved when #5537 retired the `describeIfMysql` reachability
probe, but the _adapter-current_ gate `describeIfMysqlAdapter` is still defined in
`packages/activerecord/src/adapters/abstract-mysql-adapter/test-helper.ts` and imported
cross-tree, so test files outside the MySQL tree still pull gate glue from it:

- `packages/activerecord/src/defaults.test.ts` — `describeIfMysqlAdapter`, `isMariaDb`,
  `Mysql2Adapter`, `MYSQL_TEST_URL`
- `packages/activerecord/src/migration.test.ts:41-45` — `describeIfMysqlAdapter`,
  `leaseMysqlAdapter`, `Mysql2Adapter`
- `packages/activerecord/src/invalid-connection.test.ts` — `describeIfMysqlAdapter`
- `packages/activerecord/src/connection-adapters/mysql-type-lookup.test.ts` —
  `describeIfMysqlAdapter`
- `packages/activerecord/src/adapter.test.ts:38-43` — `leaseMysqlAdapter`,
  `Mysql2Adapter`, `ARUNIT_DATABASE`, `ARUNIT2_DATABASE`
- `packages/activerecord/src/support/supports.ts:50` and `support/supports.test.ts:9` —
  dynamic `import()` of `supportsExpressionIndex`

`describeIfMysqlAdapter` is a one-line `adapterType === "mysql"` gate with no server
probe behind it, so relocating it to `support/describe-if-mysql-adapter.ts` is cheap and
completes the set alongside `describe-if-sqlite.ts` / `describe-if-pg.ts`. The other
symbols (`leaseMysqlAdapter`, `Mysql2Adapter`, `ARUNIT*`, `supportsExpressionIndex`) are
genuinely MySQL-tree helpers — decide per symbol whether the importer should reach for
`connection-adapters/mysql2-adapter.js` directly (as #5540 did for `PostgreSQLAdapter`)
or whether the helper belongs in `support/` too.

`scripts/test-compare/gates.ts` recognizes these wrappers by name, not import path, so
relocation does not move the parity:test gate delta (verified in #5536 and #5540).

## Acceptance criteria

- [ ] `describeIfMysqlAdapter` lives in a tree-neutral `support/` module alongside
      `describe-if-sqlite.ts` and `describe-if-pg.ts`.
- [ ] Every cross-tree importer repointed; no test file outside
      `adapters/abstract-mysql-adapter/` imports a gate from that tree.
- [ ] `support/supports.ts` no longer dynamic-imports from an adapter test-helper tree.
- [ ] One definition per predicate — no duplicated gate.
- [ ] The MySQL `test-helper.ts` docstring matches what it still holds.
- [ ] Test names unchanged; parity:api and parity:test deltas non-negative.
