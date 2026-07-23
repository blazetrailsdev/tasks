---
title: "PG virtual-column build fixture sql should use canonical virtualColumnFixtureData"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/postgresql/virtual-column.test.ts:132`
hardcodes the fixture rows inline:

```ts
const fixtures = await FixtureSet.createFixtures(adapter, VirtualColumn, {
  one: { name: "hello" },
  two: { name: "world" },
});
```

Rails' `test_build_fixture_sql` reads the real fixture file:
`ActiveRecord::FixtureSet.create_fixtures(FIXTURES_ROOT, :virtual_columns)`
(vendor/rails/activerecord/test/cases/adapters/postgresql/virtual_column_test.rb),
whose data lives in vendor/rails/activerecord/test/fixtures/virtual_columns.yml.

The canonical mirror of that file already exists as
`virtualColumnFixtureData` in
packages/activerecord/src/test-helpers/fixtures/virtual-columns.ts (added
in #2213). PR #5177 switched the sqlite3 sibling over to it; the PG one was
left on the inline literal and is now the odd one out. Two copies of the same
fixture data can drift.

## Acceptance criteria

- The PG `build fixture sql` test drives `virtualColumnFixtureData` instead of
  an inline object literal.
- Test name unchanged; `adapters/postgresql/virtual_column_test.rb` stays at 0
  test:compare mismatches.
