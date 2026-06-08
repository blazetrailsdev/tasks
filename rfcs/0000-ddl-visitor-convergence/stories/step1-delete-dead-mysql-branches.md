---
title: "Step 1 — Delete dead MySQL branches from AbstractTableDefinition.toSql()"
status: draft
updated: 2026-06-08
rfc: "0000-ddl-visitor-convergence"
cluster: ddl-visitor-convergence
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`MysqlTableDefinition.toSql()` routes directly to `MysqlSchemaCreation.accept(this)`
and never calls `super.toSql()`. This makes nine `_adapterName === "mysql"` code paths
in `AbstractTableDefinition.toSql()` dead code — they execute (the condition evaluates)
for SQLite and PG, but always produce `false` and no output. They duplicate logic that
the MySQL visitor already owns.

See RFC §Dead code in `AbstractTableDefinition.toSql()` for the full inventory.

This story is zero-risk: deleting these branches produces identical output for all
adapters. No test assertions will change.

## Acceptance criteria

- [ ] All nine dead-for-MySQL code paths deleted from
      `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:toSql()`.
      Specifically (verify against `main` line numbers before editing):
  - `_adapterName === "mysql"` arm of `primary_key` type switch (~L1077-1079)
  - `_adapterName === "mysql"` arm of `uuid` type switch (~L1086-1087)
  - `_adapterName === "mysql"` per-column charset/collation block (~L1179-1190)
  - `_adapterName !== "postgres"` throw in the array block (~L1193-1195) — becomes
    unconditional throw (safe: SQLite/MySQL both don't support arrays)
  - `_adapterName !== "postgres"` throw in the generated-column block (~L1208-1214) —
    keep the PG path; the error message just loses the adapter name
  - `_adapterName === "mysql" && this.indexes.length > 0` CTAS path (~L1249-1251) —
    collapse to just `` sql += ` AS ${this.as}` ``
  - `_adapterName === "mysql"` inline-index block (~L1293-1297) — delete
  - `_adapterName === "mysql"` table-level charset/collation block (~L1301-1309) — delete
  - `_adapterName === "mysql"` table-level COMMENT block (~L1312-1315) — delete
- [ ] `pnpm tsc --build` clean.
- [ ] `pnpm vitest run packages/activerecord/src/connection-adapters/abstract/schema-definitions.test.ts`
      passes. If any test explicitly asserts `_adapterName === "mysql"` output from a
      base `TableDefinition`, migrate it to `MysqlTableDefinition`.

## Notes

The `assertSafeMysqlIdentifier` import in `abstract/schema-definitions.ts` may become
unused after deleting the MySQL charset/collation blocks — remove the import if so.

Do not touch `MysqlTableDefinition`, `MysqlSchemaCreation`, or any other file.
This is a pure deletion in `abstract/schema-definitions.ts`.
