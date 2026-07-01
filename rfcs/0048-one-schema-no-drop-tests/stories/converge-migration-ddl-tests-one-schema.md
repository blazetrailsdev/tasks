---
title: "converge-migration-ddl-tests-one-schema"
status: claimed
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-07-01T20:46:14Z"
assignee: "converge-migration-ddl-tests-one-schema"
blocked-by: null
---

## Context

> **BLOCKED / MIS-SPECIFIED (2026-07-01).** This story cannot be executed or
> verified against `main`, and its scratch-table prescription is anti-fidelity
> for the people-migration subset. Blocked on spike **#4246** (the one-schema
> flag + DDL-lane infra). Details:
>
> 1. **The verification harness isn't on `main`.** `AR_ONE_SCHEMA` is
>    unreferenced and `eslint/one-schema-exclude.json` does not exist on
>    `origin/main` — both live only in unmerged spike #4246. So the acceptance
>    criteria (run under the flag, remove the exclude entry) are unrunnable and
>    the "11 failing tests" cannot be reproduced.
> 2. **No DDL-isolation primitive exists.** `createTestAdapter()` and
>    `createSidecarTestAdapter()` both lease from the same shared per-worker
>    pool (`test-adapter.ts:194-229`) — there is no scratch DB. Moving DDL to
>    "per-test scratch tables" does not isolate at the schema level; the tables
>    still land in the one shared worker schema.
> 3. **The people add/remove-column tests are ALREADY Rails-faithful.** Rails'
>    `migration_test.rb` (≈lines 356-361, 384-385) runs `add_column`/
>    `remove_column` against the canonical `people` table and strips it in
>    teardown; the trails port mirrors this, afterEach strip included. The flag's
>    "no canonical reshape" rule is _stricter than Rails_, so rewriting these
>    onto invented scratch tables would DEVIATE from Rails — the opposite of
>    fidelity-first. Do NOT scratch-table them.
>
> **Fidelity-preserving fix (post-#4246):** route `migration.test.ts` to a
> dedicated DDL lane that runs flag-off (the "OR" already noted below). Only the
> tests that genuinely create their own tables in Rails (create_table-with-
> indexes, name-collision-across-dbs, drop-index) build scratch tables; the
> people column tests stay on canonical `people` exactly as Rails does. Revisit
> once #4246 lands and rewrite the acceptance criteria around the lane.

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
