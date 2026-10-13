---
title: "activerecord-test-case-remaining-members-and-one-test-object"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/cases/test-case.ts` ports `ActiveRecord::TestCase`
(`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:21-33,86-88`) as far as its superclass,
`include ActiveRecord::TestFixtures`, the three fixture settings and `create_fixtures`. Two things are left.

- The rest of the class body is unported there: the other includes (`MethodCallAssertions`, `Stream`,
  `QueryAssertions`, `ValidationsRepairHelper`, `AdapterHelper`, `LoadSchemaHelper`, `test_case.rb:22-30`),
  `after_teardown` / `check_connection_leaks` (`:35-84`), and the helpers from `capture_sql` to
  `quote_table_name` (`:90-279`). Several live as free functions elsewhere (`cases/helper.ts`,
  `testing/query-assertions.ts`, `support/adapter-helper.ts`).
- `fixtures()` in `packages/activerecord/src/test-fixtures.ts` builds its own per-test instance of the
  per-describe `ActiveRecord::TestCase` subclass, beside the `ActiveSupport::TestCase` instance
  `packages/activesupport/src/testing/autorun.ts` builds for the same vitest test. So one test has two test
  objects, and the harness calls `setupFixtures` / `teardownFixtures` on its own instance directly, because
  running `before_setup` / `after_teardown` there would run ActiveSupport's per-test lifecycle a second time
  (`TestsWithoutAssertions#after_teardown` then looks up a method named after the vitest title and raises
  `NameError`). Rails has one object, whose `before_setup` is `setup_fixtures; super`
  (`activerecord/lib/active_record/test_fixtures.rb`).

## Acceptance criteria

- [ ] `ActiveRecord::TestCase`'s remaining includes and methods are on the class at their Rails names, and
      the free-function duplicates are deleted or delegate to nothing.
- [ ] A vitest test under `fixtures()` has one test object: autorun instantiates the per-describe
      `ActiveRecord::TestCase` subclass, and fixture setup and teardown run through `beforeSetup` /
      `afterTeardown`.
