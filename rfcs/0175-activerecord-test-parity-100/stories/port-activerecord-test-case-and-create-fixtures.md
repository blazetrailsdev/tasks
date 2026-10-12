---
title: "ActiveRecord::TestCase (cases/test_case.rb) and its create_fixtures have no shared port"
status: ready
updated: 2026-10-11
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
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

Rails' AR test suite inherits from `ActiveRecord::TestCase`
(`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb`), which includes
`ActiveRecord::TestFixtures`, sets `fixture_paths`, and defines helpers such as
`create_fixtures(*fixture_set_names)` (`test_case.rb:86-88`):
`ActiveRecord::FixtureSet.create_fixtures(ActiveRecord::TestCase.fixture_paths, fixture_set_names, fixture_class_names)`.

trails has no port of that class. trails#8801 ported the `Class.new(ActiveRecord::TestCase)`
cases of `fixtures_test.rb:604-646` against a file-local stand-in in
`packages/activerecord/src/fixtures.test.ts` (`ActiveRecordTestCase`, a `Minitest.Test`
subclass that includes `TestFixtures` and sets `fixturePaths`), and defines `createFixtures`
locally in two describes (`FasterFixturesTest`, `FixturesResetPkSequenceTest`). Other tests
in that file call `FixtureSet.createFixtures(TS_FIXTURES_ROOT, name, { ... })` directly
where Rails calls `create_fixtures(name)`. `fixtures()` in
`packages/activerecord/src/test-fixtures.ts` builds its own root test case class
(`testCaseClassFor`) for the same role.

## Acceptance criteria

- [ ] `ActiveRecord::TestCase` ported once at the path `cases/test_case.rb` maps to, with
      `create_fixtures` at its Rails name and body, and used as the root class `fixtures()`
      derives per-describe classes from.
- [ ] `fixtures.test.ts` drops its file-local stand-in and its two local `createFixtures`
      helpers, and its direct `FixtureSet.createFixtures(TS_FIXTURES_ROOT, ...)` calls where
      Rails calls `create_fixtures` go through the helper.
