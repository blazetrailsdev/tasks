---
title: "Nest the truncate-all prefix and suffix describes under DatabaseTasksTruncateAllTest"
status: ready
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasksTruncateAllWithPrefixTest` and
`DatabaseTasksTruncateAllWithSuffixTest` are defined inside the body of
`DatabaseTasksTruncateAllTest`
(`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb:1300-1368`),
and each inherits its `test_truncate_tables`. Since
`test-compare-credits-tests-inherited-from-a-same-file-superclass` the Ruby
extractor emits those two inherited tests, and `pnpm parity:test --package
activerecord` reports them as 2 `wrong describe` rows: the two describes in
`packages/activerecord/src/tasks/database-tasks.test.ts` are siblings of
`describe("DatabaseTasksTruncateAllTest")`, not nested in it.

Nesting them is not a pure move. `databaseTasksTruncateAllTest()` registers the
superclass's `beforeEach` / `afterEach` each time it is called, so a nested
describe that calls it again runs the setup twice, and one that does not runs
the parent's setup before its own prefix assignment. Rails runs the subclass's
`setup do` callback first and `def setup` after it (`:1350-1352`, `:1306`), so
`schema_migration.create_table` already sees the prefix.

## Acceptance criteria

- [ ] The two describes are nested under
      `describe("DatabaseTasksTruncateAllTest")`, with the prefix or suffix
      set before the superclass's setup runs and that setup running once.
- [ ] `pnpm parity:test --package activerecord` reports 0 `wrong describe`
      for `tasks/database_tasks_test.rb`.
