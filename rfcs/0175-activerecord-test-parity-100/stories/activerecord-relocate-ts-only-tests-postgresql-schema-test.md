---
title: "activerecord: move the 6 TS-only tests left in adapters/postgresql/schema.test.ts to a .trails sibling"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8844
claim: "2026-10-13T02:48:07Z"
assignee: "activerecord-relocate-ts-only-tests-postgresql-schema-test"
blocked-by: null
closed-reason: null
---

## Context

Split from `activerecord-relocate-ts-only-tests-postgresql-remaining-seven-files`, whose PR moved
the extras of six files and left this one at the LOC ceiling. A pure move costs each line twice.

`packages/activerecord/src/adapters/postgresql/schema.test.ts` still reports 6 extras in
`pnpm parity:test`. Every Rails test in the file is matched (71 of 71, 0 missing), so none is a
Rails test under a drifted name, and `vendor/rails/v8.0.2/activerecord/test/cases/adapters/postgresql/schema_test.rb`
has no counterpart for any of them:

- In `SchemaTest`: `schema test 1`, `schema test 2`, `schema test 3`,
  `column exists honors search path`, `indexes report their validity`.
- `table comment is dumped and round-trips via createTable`, the only test in
  `SchemaTableCommentTest`. That describe has no Rails counterpart, so it moves whole with its
  `afterEach`.

The `SchemaTest` five read `test_schema.things` and `test_schema2.things`, which the file's
`setupSchemas` builds. The sibling needs only that part: the two `CREATE SCHEMA ... CREATE TABLE`
statements, one index on `test_schema.things` for `indexes report their validity`, a teardown that
drops both schemas, and the outer `defaultSearchPath` save and restore. It also needs the
`AR_NO_AUTO_SCHEMA` stub and `fixtures({}, { useTransactionalTests: false })`.

A new `.trails.test.ts` file is linted without the `no-explicit-any` allowance the old files have.

About 65 test lines move; with the setup the PR is about 200 LOC.

## Acceptance criteria

- [ ] The six tests move unchanged to `schema.trails.test.ts`.
- [ ] `schema.test.ts` reports 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
