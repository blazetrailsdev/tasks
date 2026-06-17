---
title: "Burn down require-table-teardown: 6 postgresql adapter test files (collation, invertible-migration, range, schema, uuid, virtual-column)"
status: in-progress
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 9
pr: 3555
claim: "2026-06-17T16:48:25Z"
assignee: "require-table-teardown-burndown-pg-adapters"
blocked-by: null
---

## Context

The `require-table-teardown` ESLint rule (`eslint/require-table-teardown.mjs`)
requires every `createTable("foo", …)` in a test file to be balanced by a
named `dropTable("foo")` (no `dropAllTables()`). This story owns the 6
PG-adapter files on the exclude baseline
(`eslint/require-table-teardown-exclude.json`):

- `packages/activerecord/src/adapters/postgresql/collation.test.ts`
- `packages/activerecord/src/adapters/postgresql/invertible-migration.test.ts`
- `packages/activerecord/src/adapters/postgresql/range.test.ts`
- `packages/activerecord/src/adapters/postgresql/schema.test.ts`
- `packages/activerecord/src/adapters/postgresql/uuid.test.ts`
- `packages/activerecord/src/adapters/postgresql/virtual-column.test.ts`

These mirror Rails `test/cases/adapters/postgresql/*_test.rb`, which create
PG-specific bespoke tables (ranges, uuid PKs, generated columns, collations) —
canonical-schema conversion is mostly NOT the answer here; Rails itself uses
`setup`/`teardown` create/drop pairs in these files. The work is to mirror
Rails' teardown word-for-word: each `setup` create gets the matching
`teardown` drop (`afterEach`/`afterAll`), including `dropTable(..., {
ifExists: true })` where Rails uses `if_exists: true`. Watch for:

- Tests that intentionally raise `StatementInvalid` mid-transaction poison PG
  transactional-fixtures teardown — if a file uses `useHandlerFixtures`, list
  those tests in `usesTransaction: [...]` (see the project memory note on PG
  deliberate-error tests).
- Some files also create PG **types/extensions** (enum types, `citext`,
  `hstore`); the rule only tracks tables, but mirror Rails' drops for those
  too while in the file.

Then remove each file from the exclude baseline so the ratchet holds. These
tests are PG-gated (`describeIfPg`) — verify locally with `pnpm db:up` +
`pnpm vitest run <file>` under `PG_TEST_URL` (see `test:db` in package.json);
CI's postgres lane gates them on push.

## Acceptance criteria

- [ ] The 6 files are removed from `eslint/require-table-teardown-exclude.json`
      and `pnpm lint` passes (no `eslint-disable` escapes, no
      `dropAllTables()`).
- [ ] Teardown structure mirrors the Rails counterpart file's
      `setup`/`teardown` (cite the Rails file per test file in the PR
      description).
- [ ] Touched files pass locally against live PG; no test renames; no
      full-suite run.
