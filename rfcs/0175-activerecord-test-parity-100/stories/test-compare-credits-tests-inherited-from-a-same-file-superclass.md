---
title: "test-compare: credit the tests a Rails test class inherits from a same-file superclass"
status: draft
updated: 2026-10-13
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

`pnpm parity:test` reports 12 extra (TS only) tests in
`packages/activerecord/src/migration/foreign-key.test.ts`. They are not
TS-only. They are the six tests of `ForeignKeyChangeColumnTest`, ported a
second and third time under `ForeignKeyChangeColumnWithPrefixTest` and
`ForeignKeyChangeColumnWithSuffixTest`, which is what Rails runs:

```ruby
class ForeignKeyChangeColumnWithPrefixTest < ForeignKeyChangeColumnTest
  setup do
    ActiveRecord::Base.table_name_prefix = "p_"
  end
```

(`vendor/rails/v8.0.2/activerecord/test/cases/migration/foreign_key_test.rb:145-163`.)
The two subclasses define no test of their own and inherit all six.

`scripts/test-compare/extract-ruby-tests.rb` emits a test only under the class
whose body defines it. It already replays an included module's tests into each
including class (around line 205 and line 455), but has no equivalent for a
test class that subclasses another test class in the same file. So the 12
ported tests have nothing to match and count as extra.

`activerecord-relocate-ts-only-tests-smaller-dirs` left them in place, since
moving a ported Rails test to a `.trails.test.ts` sibling would record it as
having no Rails analog.

The same gap hides inherited tests elsewhere. A rough scan of test classes
whose superclass is a test class defined in the same file and carrying tests:

- activerecord: `fixtures_test.rb` (`SetupSubclassTest`), `adapters/postgresql/hstore_test.rb`
  (`HstoreWithSerialize`, 41 tests), `coders/yaml_column_test.rb`
  (`YAMLColumnTestWithSafeLoad`, 9), `tasks/database_tasks_test.rb`
  (`DatabaseTasksTruncateAllWithPrefixTest` / `...WithSuffixTest`).
- actionpack about 60 tests, actionview about 90, activesupport about 13.

Emitting them raises the Rails test count, so most of those become `missing`
rows until ported. Size the change with a dry run first and decide whether it
lands per package.

## Acceptance criteria

- [ ] The Ruby extractor emits a same-file test superclass's tests under each subclass, keyed by the subclass name, with a unit test in `scripts/test-compare/`.
- [ ] `migration/foreign-key.test.ts` reports 0 extra with its 12 tests matched, not moved.
- [ ] Every newly reported `missing` test is either ported in the same PR or filed as a story under its package's RFC.
