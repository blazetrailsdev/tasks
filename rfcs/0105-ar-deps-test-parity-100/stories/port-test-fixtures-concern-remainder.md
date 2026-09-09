---
title: "port-test-fixtures-concern-remainder"
status: draft
updated: 2026-09-09
rfc: "0105-ar-deps-test-parity-100"
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

`port-fixture-set-file-and-test-fixtures-cases` ported only the `included do`
block of `ActiveRecord::TestFixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:20-40`) — the
eight `class_attribute` declarations plus
`ActiveSupport.run_load_hooks(:active_record_fixtures, self)` — as
`TestFixtures` in `packages/activerecord/src/test-fixtures.ts`. That was enough
for three of `test_fixtures_test.rb`'s four cases.

The rest of the concern is still unported, which is why `test_fixtures.rb` keeps
a source-level row in `scripts/parity/unported-files/unscoped.ts` and why
`test_fixtures_test.rb`'s fourth case carries a case-level exclusion there:

- `before_setup` / `after_teardown` (`test_fixtures.rb:9-18`).
- `ClassMethods#set_fixture_class`, `#fixtures`, `#setup_fixture_accessors`
  (`test_fixtures.rb:43-95`) — including the `fixtures :all` glob over
  `fixture_paths`, which trails has no counterpart for because its fixture
  corpus is TS modules under `test-helpers/fixtures/`, not `.yml` on disk.
- `setup_fixtures` / `teardown_fixtures` and the transactional wrapping
  (`test_fixtures.rb:97-200`). trails' equivalents already exist but under
  trails names, in `test-fixtures/with-transactional-fixtures.ts` and
  `test-fixtures/fixture-connection.ts`.

The excluded case, `doesnt rely on active support test case specific methods`
(`test_fixtures_test.rb:33-72`), constructs a `Class.new(Minitest::Test)` and
runs it, which needs both `fixtures :all` over a real `.yml` directory and a
runnable-per-instance test object; neither exists in vitest.

## Acceptance criteria

- Decide, with the Rails source in front of you, which of the remaining
  `TestFixtures` members have a faithful trails home: rename trails'
  `withTransactionalFixtures` / `leaseFixtureConnection` machinery onto the
  Rails names where it already IS that machinery, or record why a member cannot
  land.
- Narrow or retire the `pattern: "test_fixtures.rb"` row in
  `scripts/parity/unported-files/unscoped.ts` to whatever genuinely stays
  unported, deleting its `baseline.json` row if one survives.
- Either port `doesnt rely on active support test case specific methods` or
  keep its case-level row with a reason that reflects the post-story state.
