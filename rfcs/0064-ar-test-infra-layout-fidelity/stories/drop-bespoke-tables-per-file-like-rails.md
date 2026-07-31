---
title: "Drop bespoke test tables per-file like Rails teardown"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5698
claim: "2026-07-31T01:15:07Z"
assignee: "drop-bespoke-tables-per-file-like-rails"
blocked-by: null
closed-reason: null
---

## Context

`remove-global-reset-and-skip-shield-after-canonical-burndown` is blocked
because the global `beforeEach` reset in
`packages/activerecord/src/cases/helper.ts:75-77` still has real work to do:
`resetTestTables` (`packages/activerecord/src/test-adapter.ts:257`) DROPs every
non-canonical table so bespoke leftovers don't leak into the shared worker DB
where the next file would see them.

`defineSchema` is already fully burned out of AR test files (the only surviving
mentions are prose plus the dumper/generator emitting the string). What
survives is direct `createTable(...)` in tests: **90 `*.test.ts` files creating
164 distinct table names absent from `TEST_SCHEMA`** — `testings`,
`more_testings`, `horses` / `new_horses`, `octopi`, `rockets` / `p_rockets`,
`astronauts`, `postgresql_serials` / `postgresql_moneys`, `hstores`, `ltrees`,
`citexts`, `bk1`..`bk7`, `foo` / `foos` / `foo_bar`, `delete_me`,
`test_models`, the `cd_*` / `nt_*` / `rw_*` / `djs_*` clusters, and so on.

Crucially most of those are **Rails-faithful, not trails inventions**: Rails'
own suite creates the same tables and cleans them up per-file rather than
relying on any global sweep. See
`vendor/rails/activerecord/test/cases/migration_test.rb:53-67` (a `teardown do`
block dropping `things awesome_things prefix_things_suffix
p_awesome_things_s`), `:1231-1233` (`teardown { drop_table(:delete_me) rescue
nil }`), and the inline `connection.drop_table :testings, if_exists: true`
at `:170`, `:185`, `:226`, `:240`, plus `:465` (`big_numbers`) and `:903`
(`binary_testings`).

So the unblock is not "wait for the canonical burndown" — it is porting Rails'
per-file cleanup discipline. Once every file that creates a non-canonical table
drops it in its own teardown (as Rails does), `resetTestTables` has nothing
left to sweep and the global reset plus `support/skip-global-reset.ts` can go.

Current gap sizing: of the 90 `createTable(` test files, 78 already call
`dropTable(` somewhere; **12 call it nowhere at all**:

- `multi-db-migrator.trails.test.ts`
- `test-databases.test.ts`
- `view.test.ts`
- `adapters/postgresql/create-unlogged-tables.test.ts`
- `connection-adapters/abstract/schema-dumper.test.ts`
- `adapters/sqlite3/sqlite3-adapter.test.ts`
- `connection-adapters/abstract/schema-statements-privates.test.ts`
- `tasks/database-tasks-rollback.trails.test.ts`
- `migration/command-recorder.test.ts`
- `support/handler-resolved-adapter.test.ts`
- `tasks/database-tasks.test.ts`
- `test-fixtures/with-transactional-fixtures.test.ts`

"Calls `dropTable` somewhere" is a weak proxy — the remaining 78 still need
auditing for tables created but never dropped, and for drops that only run on
the happy path (Rails uses `teardown` / `rescue nil` / `if_exists: true`
precisely so a failing assertion still cleans up).

This is larger than one PR at the 500 LOC ceiling. Land the audit plus the
12 zero-cleanup files here and register the remaining clusters as follow-up
stories rather than fanning out.

## Acceptance criteria

- Produce the authoritative inventory: for every AR test file, the
  non-canonical tables it creates vs the tables it drops, so the residual set
  is known rather than estimated. Prefer a checked-in script or lint rule over
  a one-off, so the set can be re-measured as clusters land.
- For the 12 files above, add per-file cleanup mirroring the Rails counterpart
  — `afterAll` / `afterEach` `dropTable(name, { ifExists: true })`, matching
  the vendored file's `teardown` shape (`migration_test.rb:53-67`, `:1231-1233`).
  Cleanup must run even when a test fails, exactly like Ruby's `teardown`.
- Where a table is genuinely canonical-eligible (it exists in
  `vendor/rails/activerecord/test/schema/schema.rb`), move it into
  `TEST_SCHEMA` instead of adding cleanup — do not invent a table either way.
- No test-name changes. No new bespoke tables. Do not remove the global reset
  or the skip shield in this story — that stays with
  `remove-global-reset-and-skip-shield-after-canonical-burndown`, which this
  unblocks.
- Register the remaining audited clusters as follow-up stories under RFC 0064
  with `pnpm tasks new`, each carrying its file list and Rails `file:line`
  anchors.
