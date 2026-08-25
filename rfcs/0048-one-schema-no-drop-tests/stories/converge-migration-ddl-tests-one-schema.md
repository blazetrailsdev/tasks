---
title: "converge-migration-ddl-tests-one-schema"
status: done
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 4395
claim: "2026-07-02T01:45:01Z"
assignee: "converge-migration-ddl-tests-one-schema"
blocked-by: null
---

## Context

> **CORRECTION (2026-07-01, supersedes an earlier "blocked on #4246" note).**
> The one-schema harness (`AR_ONE_SCHEMA`, `eslint/one-schema-exclude.json`,
> `test-helpers/one-schema.ts`) **is present on the `existing-db-schema-rc`
> branch** — the earlier note was written against `origin/main`, which doesn't
> carry it, and #4246 is NOT being merged. So this story is executable on that
> branch and is NOT blocked. Two findings still hold and constrain the fix:
>
> 1. **The people add/remove-column tests are ALREADY Rails-faithful.** Rails'
>    `migration_test.rb` (≈lines 356-361, 384-385) runs `add_column`/
>    `remove_column` against the canonical `people` table and strips it in
>    teardown; the trails port mirrors this, afterEach strip included. Under
>    truncate-not-drop the reshape leaks — probed 2026-07-01 the file throws
>    `StatementInvalid: duplicate column name: last_name`. The one-schema
>    "no canonical reshape" rule is _stricter than Rails here_; do NOT rewrite
>    these onto invented scratch tables (that would DEVIATE from Rails).
> 2. **No separate scratch DB exists** — `createTestAdapter()` /
>    `createSidecarTestAdapter()` lease from the one shared per-worker pool
>    (`test-adapter.ts:194-229`), so "per-test scratch table" doesn't isolate at
>    the schema level.
>
> **Fidelity-preserving fix:** give `migration.test.ts` a way to run its genuine
> DDL flag-off (a dedicated DDL lane, or per-test create+drop of its own table
> mirroring Rails for the create_table-with-indexes / name-collision / drop-index
> cases) while the people add/remove-column tests keep mutating canonical
> `people` exactly as Rails does + strip in teardown. Rewrite the acceptance
> criteria below around that lane rather than the "no canonical reshape" absolute.

`packages/activerecord/src/migration.test.ts` is on `eslint/one-schema-exclude.json`.
PR #4370 (`converge-migration-tests-one-schema`) converged only the
people-migration subset; the file still fails under `AR_ONE_SCHEMA=1` because a
block of tests issue real DDL that reshapes/creates tables mid-run, which the
frozen shared canonical schema forbids. Verified 2026-07-01 on the merged
one-schema branch: 11 failing tests under the flag.

The failing tests are genuine DDL-behavior tests (add/remove column with
if_exists/if_not_exists, create_table with indexes, drop index, internal
metadata on failed migration, cross-db name collision) — they cannot no-op
against canonical tables; they need their own migration-scoped tables that are
created and torn down within the test, mirroring Rails' `ActiveRecord::Migration`
test which runs its own `create_table`/`drop_table` against scratch tables
(not schema.rb tables).

Follow Rails fidelity (RFC 0048 respec / RFC 0019 style): port each test to
create + drop its own scratch table inside the test so DDL never touches
canonical tables, OR route this file to a dedicated DDL lane that runs flag-off.
Do NOT rename tests. Read the corresponding Rails
`activerecord/test/cases/migration_test.rb` cases first.

## Acceptance criteria

- `AR_ONE_SCHEMA=1 pnpm vitest run packages/activerecord/src/migration.test.ts` passes.
- These 11 tests pass under the flag (names unchanged):
  - add column with if not exists set to true
  - add column with casted type if not exists set to true
  - add column with if not exists set to true does not raise if type is different
  - remove column with if not exists not set
  - remove column with if exists set
  - create table with indexes and if not exists true
  - name collision across dbs
  - internal metadata stores environment when migration fails
  - internal metadata not used when not enabled
  - ExplicitlyNamedIndexMigrationTest > drop index by name
  - ReservedWordsMigrationTest > drop index from table named values
- `migration.test.ts` removed from `eslint/one-schema-exclude.json`.
- No test renames; DDL confined to per-test scratch tables (no canonical reshape).
