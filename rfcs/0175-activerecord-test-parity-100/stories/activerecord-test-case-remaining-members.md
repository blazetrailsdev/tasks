---
title: "ActiveRecord::TestCase's remaining includes and methods are on the class"
status: claimed
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps:
  - activerecord-test-case-remaining-members-and-one-test-object
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-10-13T21:12:25Z"
assignee: "activerecord-test-case-remaining-members"
blocked-by: null
closed-reason: null
---

## Context

`activerecord-test-case-remaining-members-and-one-test-object` shipped its
second half: a vitest test under `fixtures()` has one test object. `fixtures()`
(`packages/activerecord/src/test-fixtures.ts`) registers the per-describe
`ActiveRecord::TestCase` subclass in `describedClasses`
(`packages/activesupport/src/testing/autorun.ts`), autorun instantiates it, and
fixture setup and teardown run through `beforeSetup` / `afterTeardown`.

The first half is left. `packages/activerecord/src/cases/test-case.ts` ports
`ActiveRecord::TestCase`
(`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:21-33,86-88`) as far
as its superclass, `include ActiveRecord::TestFixtures`, the three fixture
settings and `create_fixtures`. Unported on the class:

- the other includes, `test_case.rb:22-30`: `MethodCallAssertions`, `Stream`,
  `QueryAssertions`, `ValidationsRepairHelper`, `AdapterHelper` (included and
  extended), `LoadSchemaHelper` (included and extended)
- `after_teardown` / `check_connection_leaks` (`:35-84`)
- `capture_sql` (`:90`), `capture_sql_and_binds` (`:103`),
  `assert_queries_match` (`:112`), `assert_column` / `assert_no_column`
  (`:127-135`), `with_has_many_inversing` (`:137`),
  `with_automatic_scope_inversing` (`:145`), `with_db_warnings_action` (`:165`),
  `reset_callbacks` (`:181`), `with_postgresql_datetime_type` (`:195`),
  `with_env_tz` (`:207`), `with_timezone_config` (`:214`),
  `verify_default_timezone_config` and its four `EXPECTED_*` constants
  (`:241-278`), `clean_up_connection_handler` (`:280`), `quote_table_name`
  (`:293`)

Several live as free functions in `cases/helper.ts`,
`testing/query-assertions.ts` and `support/adapter-helper.ts`, called from test
files directly. With one test object, a test reaches the methods through
`fixtures(...).self()` or vitest's `context.testCase`.

The harness class `fixtures()` builds overrides `beforeSetup` to warm the
schema cache, resolve the registry's model classes and prime the fixture cache
with `await fixture.find()`, because the fixture accessor is synchronous. That
override is harness surface Rails does not have.

## Findings from trails#8868

- Several of the Rails bodies read `self`: `with_db_warnings_action` restores
  `@original_db_warnings_action` (`test_case.rb:176`), `with_timezone_config`
  calls `verify_default_timezone_config` (`:215`), and `assert_queries_match`
  calls `_assert_nothing_raised_or_warn` (`:116`). So a caller has to be an
  `ActiveRecord::TestCase` instance. Only a test under `fixtures()` is one
  today; every other activerecord test gets an `ActiveSupport::TestCase`.
  Making each test an `ActiveRecord::TestCase`, as Rails has it, turns on
  `use_transactional_tests` for the whole suite.
- `captureSql` and its `stub` option are owned by
  `capture-sql-is-test-case-capture-sql-over-sql-counter-with-no-stub`, which
  the owner parked on 2026-10-08 as a test-helper relocation across many call
  sites, to resume on an owner decision. The same decision covers the
  relocation here.
- `describedClasses` and `topLevel` in `activesupport/src/testing/autorun.ts`
  carry `@noRailsEquivalent CONVERGEABLE` receipts naming this story. They
  exist because `fixtures()` builds an anonymous class per describe; they go
  when a describe's class is the constant its suite is named after.

## Acceptance criteria

- [ ] `ActiveRecord::TestCase`'s remaining includes and methods are on the
      class at their Rails names, and the free-function duplicates are deleted.
- [ ] `after_teardown` runs `check_connection_leaks` after `super`.
- [ ] `describedClasses` and `topLevel` are deleted with their receipts.
