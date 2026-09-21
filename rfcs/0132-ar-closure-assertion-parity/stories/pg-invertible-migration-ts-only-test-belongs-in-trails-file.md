---
title: "Move the TS-only 'migrate and revert' test out of the Rails-mirroring pg invertible-migration file"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 7
pr: trails#7927
claim: "2026-09-21T13:49:04Z"
assignee: "pg-invertible-migration-ts-only-test-belongs-in-trails-file"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/postgresql/invertible-migration.test.ts`
opens with `it("migrate and revert")`, which has **no counterpart** in
`vendor/rails/activerecord/test/cases/adapters/postgresql/invertible_migration_test.rb`.
The Rails file defines exactly six tests
(`invertible_migration_test.rb:69-138`: `test_migrate_revert_add_index_with_expression`,
`…_create_enum`, `…_drop_enum`, `…_rename_enum_value`,
`…_add_and_validate_check_constraint`, `…_add_and_validate_foreign_key`), and the
port matches all six. The seventh is a trails invention — it round-trips a
`create_table`/`drop_table` migration that the other six already cover
incidentally.

Surfaced while converging this file's assertions in trails#7908. It is the
`1 extra` on the file's `parity:test` row:

```text
adapters/postgresql/invertible_migration_test.rb  …  6  0  0  0  0  1  6 ✓
```

Per CLAUDE.md ("Tests live next to source files as `*.test.ts`") and the repo's
settled split, a TS-only test belongs in the `.trails.test.ts` sibling, not in
the file that mirrors a Rails test file. Leaving it where it is inflates the
package-wide `extra (TS only)` count (962 today) with a row that reads as
unported Rails coverage.

It also still extends `Migration` directly rather than the `SilentMigration`
fixture the six Rails tests now inherit
(`invertible_migration_test.rb:6-8`), so it is the only migration in the file
that prints `-- createTable("settings")` / `-> 0.0030s` during a run.

## Acceptance criteria

- `it("migrate and revert")` moves to
  `packages/activerecord/src/adapters/postgresql/invertible-migration.trails.test.ts`,
  keeping its `describeIfPg` + `beforeEach`/`afterEach` adapter setup.
- The Rails-mirroring file keeps exactly the six tests Rails defines; its
  `parity:test` row reports `0` extra.
- Package-wide `extra (TS only)` drops by one; no other row moves.
- If the moved test is judged redundant with
  `migrate revert add index with expression` (which already asserts
  `tableExists` true-then-false across an up/down round trip), delete it
  instead and say so in the PR body.
