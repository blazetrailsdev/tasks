---
title: "sqlite3-adapter-test-with-example-table-blocks-part-2"
status: in-progress
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8883
claim: "2026-10-14T01:42:25Z"
assignee: "sqlite3-adapter-test-with-example-table-blocks-part-2"
blocked-by: null
closed-reason: null
---

## Context

Split from `sqlite3-adapter-test-with-example-table-blocks`, whose PR converted the PostgreSQL
half (`packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts` now has Rails'
`withExampleTable(definition = "...", block)` delegating to `DdlHelper.withExampleTable`,
`postgresql_adapter_test.rb:763-765`) and stopped at the LOC ceiling: wrapping a test body in a
block re-indents every line of it, which counts once as a deletion and once as an addition.

`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts` still creates its example
table with a file-local `createExampleTable()` (24 call sites) and relies on a blanket
`afterEach` issuing 25 `DROP TABLE IF EXISTS` statements for every table any test in the file
might have created.

Rails scopes the table to the test with a block:
`vendor/rails/v8.0.2/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb:1102-1108`
defines `with_example_table(definition = nil, table_name = "ex", &block)`, which fills in the
default definition and delegates to `DdlHelper#with_example_table`
(`vendor/rails/v8.0.2/activerecord/test/support/ddl_helper.rb:4-9`), and the file calls it 42
times. `DdlHelper` is ported at `packages/activerecord/src/support/ddl-helper.ts`; the file
already imports it for the `people` table in `tables` (`sqlite3_adapter_test.rb:588-595`).

Both optional positionals sit before the block, so a caller that skips them passes `undefined`
(CLAUDE.md, "An optional positional before trailing options or a block"):
`withExampleTable(undefined, undefined, async () => { ... })`. The PostgreSQL file imports the
helper as `import * as DdlHelper from "../../support/ddl-helper.js"` so the file-level function
can keep the Rails name.

The blanket teardown hides divergences: trails#8325 found an invented `items` table in
`beforeEach` masking a dropped `@conn.connect!` (`sqlite3_adapter_test.rb:601`). Each of the 25
dropped names is either a table Rails creates inside `with_example_table`, a table Rails creates
and drops in the test body, or a trails invention to converge on the Rails body.

## Acceptance criteria

- [ ] `sqlite3-adapter.test.ts` has a file-level `withExampleTable(definition, tableName, block)`
      with the Rails defaults that delegates to `support/ddl-helper.ts`, and each test that Rails
      wraps in `with_example_table` uses it.
- [ ] `createExampleTable()` and the blanket `afterEach` `DROP TABLE IF EXISTS` list are deleted;
      a table Rails creates outside `with_example_table` is dropped where Rails drops it.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
