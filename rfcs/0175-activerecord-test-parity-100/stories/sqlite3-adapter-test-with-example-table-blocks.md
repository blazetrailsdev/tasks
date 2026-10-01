---
title: "sqlite3/postgresql adapter tests: scope example tables with DdlHelper#with_example_table"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8325. `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts`
creates its example table with a file-local `createExampleTable()` (line 85, 24 call sites)
and relies on a blanket `afterEach` (line 91 onward) issuing 25 `DROP TABLE IF EXISTS`
statements for every table any test in the file might have created.

Rails scopes the table to the test with a block:
`vendor/rails/v8.0.2/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb:1102-1108`
defines `with_example_table(definition = nil, table_name = "ex", &block)` delegating to
`DdlHelper#with_example_table` (`vendor/rails/v8.0.2/activerecord/test/support/ddl_helper.rb:4-9`),
and the file calls it 42 times. `DdlHelper` is already ported at
`packages/activerecord/src/support/ddl-helper.ts`; #8325 used it for the `people` table in
`tables` (`sqlite3_adapter_test.rb:588-595`) only.

`packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts:28-40` has the same
gap: a file-local `withExampleTable(adapter, fn, definition)` with its own argument order,
where Rails' `postgresql_adapter_test.rb:13` is `include DdlHelper`.

The blanket teardown hides divergences. #8325 found one: an invented `items` table in
`beforeEach` had been masking a dropped `@conn.connect!` (`sqlite3_adapter_test.rb:601`).

## Acceptance criteria

- [ ] `sqlite3-adapter.test.ts` has a file-level `withExampleTable(definition, tableName, fn)` with the Rails defaults that delegates to `support/ddl-helper.ts`, and each test that Rails wraps in `with_example_table` uses it.
- [ ] `createExampleTable()` and the blanket `afterEach` `DROP TABLE IF EXISTS` list are deleted; a table Rails creates outside `with_example_table` is dropped where Rails drops it.
- [ ] `postgresql-adapter.test.ts` drops its local helper for the ported `DdlHelper` one, with Rails' argument order.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
