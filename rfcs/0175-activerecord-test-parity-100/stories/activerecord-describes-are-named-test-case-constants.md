---
title: "activerecord: each describe's test class is a named ActiveRecord::TestCase constant; describedClasses and topLevel are deleted"
status: draft
updated: 2026-10-13
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

`activerecord-test-case-remaining-members` put `ActiveRecord::TestCase`'s
remaining includes and methods on the class
(`packages/activerecord/src/cases/test-case.ts`, mirroring
`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:21-295`) and moved
every caller of a `test_case.rb` method onto the test object through
`fixtures(...).self()`. Its third criterion did not ship: `describedClasses` and
`topLevel` are still in `packages/activesupport/src/testing/autorun.ts`, and
their `@noRailsEquivalent CONVERGEABLE` receipts now name this story.

They exist because `fixtures()` (`packages/activerecord/src/test-fixtures.ts`,
`testCaseClassFor`) builds an anonymous `ActiveRecord::TestCase` subclass per
describe and registers it by suite object, and registers a file-level call under
`topLevel`. They go when a describe's class is the constant its suite is named
after, which `autorun.ts` already resolves with `safeConstantize(suite.name)`.

Measured on trails main at the time of filing, in `packages/activerecord/src`:

- 898 `fixtures(` calls: 85 at file top level (the `topLevel` arm), 813 inside a
  describe, 55 of those in a nested describe.
- 1,636 top-level describes: 683 carry a constant-shaped name
  (`BasicsTest`), 953 carry prose, which no constant can be named after.
- Only a test under `fixtures()` is an `ActiveRecord::TestCase`; every other
  activerecord test gets an `ActiveSupport::TestCase`. Rails has every one of
  them inherit `ActiveRecord::TestCase` (`test_case.rb:21`), which turns on
  `use_transactional_tests` (`:33`) and `check_connection_leaks` (`:35-38`)
  for the whole suite.
- The harness class `fixtures()` builds (`rootTestCase`) overrides
  `beforeSetup` to warm the schema cache, resolve the registry's model classes
  and prime the fixture cache with `await fixture.find()`, and tracks
  `currentTestCase` for `self()`. None of that is Rails surface.

Smaller gaps found while porting the class, all in
`packages/activerecord/src/cases/test-case.ts`:

- `check_connection_leaks` reads `conn.owner.backtrace` and calls
  `conn.owner&.kill` (`test_case.rb:66-67`). ruby-compat's `Thread` has no
  `backtrace` and its `Fiber` has no `kill`, so both go through a cast.
- `assert_queries_match` calls `assert_operator` (`test_case.rb:123`); Minitest's
  `assert_operator` is not ported, so the body calls `assert` with the
  comparison inlined.
- `LoadSchemaHelper#load_schema`
  (`vendor/rails/v8.0.2/activerecord/test/support/load_schema_helper.rb:4-20`)
  takes no argument; `support/load-schema-helper.ts`'s `loadSchema` takes the
  adapter. `AdapterHelper#current_adapter?`
  (`test/support/adapter_helper.rb:4-9`) asks `lease_connection.is_a?`;
  `support/adapter-helper.ts` compares the test lane.

## Acceptance criteria

- [ ] Each activerecord describe's test class is a named `ActiveRecord::TestCase`
      subclass that `safeConstantize(suite.name)` resolves, and its fixtures are
      declared on that class.
- [ ] `describedClasses` and `topLevel` are deleted with their receipts.
- [ ] Every activerecord test is an `ActiveRecord::TestCase`, with
      `useTransactionalTests = false` only where the Rails class sets it.
- [ ] `check_connection_leaks` reads `owner.backtrace` and calls `owner.kill`
      with no cast, and `assert_queries_match` calls `assertOperator`.
