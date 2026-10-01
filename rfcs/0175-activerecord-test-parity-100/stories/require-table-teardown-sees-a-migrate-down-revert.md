---
title: 'require-table-teardown: accept a migrate("down") revert as the teardown of a change()-created table'
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/require-table-teardown` (`eslint/require-table-teardown.mjs`) accepts a created table
as torn down only when it finds a literal `dropTable("name")` in an `afterEach` / `afterAll` hook
or a `finally` block. It cannot see a table dropped by reverting the migration that created it.

Rails' migration tests tear down that way. `LegacyPrimaryKeyTestCases`' teardown is
`@migration.migrate(:down) if @migration`
(`vendor/rails/v8.0.2/activerecord/test/cases/migration/compatibility_test.rb:1079-1083`), and the
`create_table` it reverts sits in the migration's `change` method.

trails#8342 therefore added a line Rails does not have:
`await connection.dropTable("legacy_primary_keys", "apples_bananas", { ifExists: true })` after
`migrate("down")` in `legacyPrimaryKeyTestCases`' `afterEach`
(`packages/activerecord/src/migration/compatibility.test.ts`). The alternative was an
`eslint-disable-next-line`, which review asked to remove.

## Converged shape

The rule treats a `createTable` written inside a migration's `change()` (or `up()` with a matching
`down()`) as torn down when the same test scope's `afterEach` / `finally` calls
`migrate("down")` on that migration. The extra `dropTable` in `compatibility.test.ts` is then
deleted so the teardown reads as Rails' does.

## Acceptance criteria

- [ ] `require-table-teardown` recognises a `migrate("down")` teardown for tables created in the
      reverted migration's `change()`, with cases in `eslint/require-table-teardown.test.mjs`
      (accepted: down in `afterEach`; rejected: no down, or down outside a hook / `finally`).
- [ ] The explicit `dropTable("legacy_primary_keys", "apples_bananas", ...)` is removed from
      `legacyPrimaryKeyTestCases` and the file still lints clean.
