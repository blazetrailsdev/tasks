---
title: "load-fixtures-once-under-transactional-tests"
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

Rails' transactional fixtures load a class's fixture sets **once** and wrap each
test in a transaction that is rolled back at teardown, so a test that mutates a
fixture row leaves the next test to see the restored row. That is the whole
mechanism `TransactionalFixturesTest` exercises: `test_destroy` destroys
`@first` and `test_destroy_just_kidding` asserts it is back
(`vendor/rails/activerecord/test/cases/fixtures_test.rb:806-819`, with
`setup_fixtures` at
`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:145-186` skipping
the reload when `@@already_loaded_fixtures[self.class]` is set and the run is
transactional).

trails' `useFixtures` (`packages/activerecord/src/test-fixtures.ts:274`)
registers the load in a `beforeEach`, so every test gets a fresh
delete-and-insert. The transaction still wraps and still rolls back, but the
reload happens after it, so the pair above passes whether or not rollback works
— the fresh insert masks the destroyed row. This was surfaced reviewing #7652,
which ports those two cases; they credit and they do exercise destroying a
fixture-loaded record, but they cannot fail for the reason Rails wrote them.

The fix is `beforeAll`-shaped: load a describe's fixture sets once when the run
is transactional, and let the per-test transaction be the thing that restores
them, exactly as `test_fixtures.rb:145-186` does. It is not a change #7652 could
carry — the lifecycle is shared by every fixture-using file in activerecord
(`grep -rl 'from "./test-fixtures.js"' packages/activerecord/src` is ~100
files), so the blast radius and the LOC both belong to their own story.

## Acceptance criteria

- With `useTransactionalTests` left at its default, a describe's fixture sets
  load once rather than per test, mirroring
  `test_fixtures.rb:145-186`'s `@@already_loaded_fixtures` skip.
- `TransactionalFixturesTest`'s `destroy` / `destroy just kidding` pair in
  `packages/activerecord/src/fixtures.test.ts` fails when the per-test
  transaction is prevented from rolling back, and passes when it is not — verify
  the failing direction explicitly, not just the green one.
- A describe that sets `useTransactionalTests: false` keeps the per-test reload;
  Rails reloads there too, since there is no transaction to restore from.
- The activerecord suite is green on all three adapter lanes.
