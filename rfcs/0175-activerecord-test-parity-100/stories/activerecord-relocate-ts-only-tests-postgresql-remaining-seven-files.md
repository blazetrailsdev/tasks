---
title: "activerecord: move the 26 TS-only tests left in seven adapters/postgresql test files to .trails siblings"
status: ready
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-relocate-ts-only-tests-adapters-postgresql`, whose PR moved the extras of
eight files and stopped at the LOC ceiling. A pure move costs each line twice.

These files in `packages/activerecord/src/adapters/postgresql/` still report extras in
`pnpm parity:test`. Every Rails test in each file is already matched (0 missing), so none is a Rails
test under a drifted name:

- `schema.test.ts`, 6: `schema test 1`, `schema test 2`, `schema test 3`,
  `column exists honors search path`, `indexes report their validity` (all in `SchemaTest`), and
  `table comment is dumped and round-trips via createTable` (`SchemaTableCommentTest`, which is left
  with only its `afterEach` and no Rails counterpart, so the whole describe moves). The `SchemaTest`
  five read the `test_schema` / `test_schema2` tables the file's `beforeAll` builds, so the sibling
  needs that part of the setup.
- `connection.test.ts`, 5: `non-default minMessages is applied to connection`,
  `disconnectBang closes the persistent connection`,
  `discardBang abandons the connection without closing the socket`,
  `reconnect resets connection so queries work again`,
  `disconnectBang then reconnect restores query capability`.
- `explain.test.ts`, 5: `Relation#explain on PG captures the SELECT via sql.active_record`,
  `Relation#explain on PG captures preload queries`, `buildExplainClause renders format json`,
  `buildExplainClause combines string flags and format`,
  `explain executes with format json and returns JSON plan`.
- `extension-migration.test.ts`, 5: `enable extension`, `disable extension`,
  `enable extension idempotent`, `disable extension idempotent`, `extension schema dump`. Check each
  against `extension_migration_test.rb` (`enable_extension_migration_ignores_prefix_and_suffix` and
  its siblings) for a duplicate before moving it.
- `array.test.ts`, 2: `schema dump renders non-empty array defaults via the element type`, and
  `inlines a proleptic-year datetime[] element as a quoted_date BC literal` in
  `describe("array datetime inline-quoting (trails)")`, which moves whole.
- `referential-integrity.test.ts`, 2: `check all foreign keys valid raises on violated constraint`,
  `check all foreign keys valid inside a transaction uses savepoint`.
- `infinity.test.ts`, 1: `updateColumns with infinity on a float column`.

About 290 test lines move; with the per-file setup the PR is about 700 LOC.

## Acceptance criteria

- [ ] Each extra is a duplicate of a ported Rails test and is deleted, or is TS-only and moves unchanged to the `.trails.test.ts` sibling.
- [ ] Setup left unused in the Rails-named file moves with the tests.
- [ ] The seven files report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
