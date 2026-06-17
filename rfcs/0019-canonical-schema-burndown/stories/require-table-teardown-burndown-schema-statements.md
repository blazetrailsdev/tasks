---
title: "Burn down require-table-teardown: abstract-mysql active-schema + schema-statements-on-adapter test files"
status: claimed
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 9
pr: null
claim: "2026-06-17T17:01:24Z"
assignee: "require-table-teardown-burndown-schema-statements"
blocked-by: null
---

## Context

The `require-table-teardown` ESLint rule (`eslint/require-table-teardown.mjs`)
requires every `createTable("foo", …)` in a test file to be balanced by a
named `dropTable("foo")` (no `dropAllTables()`). This story owns the last 2
files on the exclude baseline
(`eslint/require-table-teardown-exclude.json`) not covered by the migration
and pg-adapters sibling stories:

- `packages/activerecord/src/adapters/abstract-mysql-adapter/active-schema.test.ts`
  — mirrors Rails `test/cases/adapters/mysql2/active_schema_test.rb`. Note:
  Rails' active_schema tests largely **stub execution** (they assert generated
  DDL strings without running them); audit which of our creates actually hit
  the DB — creates that never execute may be convertible to the
  assert-the-SQL form, which removes the teardown need entirely and is the
  higher-fidelity port.
- `packages/activerecord/src/connection-adapters/abstract/schema-statements-on-adapter.test.ts`
  — schema-statement behaviors exercised directly on the adapter; mirror the
  Rails counterpart's `teardown` drops per created table.

MySQL-family verification: these are gated to MySQL via `describeIf*`; verify
locally with `pnpm db:up` + `MYSQL_TEST_URL` (see `test:db`); the mysql:8 CI
lane gates on push. Be mindful of mysql:8 DDL cost (see project memory:
mysql:8 is ~2.5× slower on DDL) — converting executed creates to stubbed
SQL-assertion form where Rails does so also reduces CI DDL load.

Then remove both files from the exclude baseline so the ratchet holds.

## Acceptance criteria

- [ ] Both files removed from `eslint/require-table-teardown-exclude.json`;
      `pnpm lint` passes (no `eslint-disable` escapes, no `dropAllTables()`).
- [ ] Creates that Rails stubs are stubbed the same way (cite the Rails
      counterpart per converted test); executed creates get named drops in the
      Rails-matching hook.
- [ ] Touched files pass locally (SQLite-runnable parts + live MySQL for the
      gated parts); no test renames; no full-suite run.
