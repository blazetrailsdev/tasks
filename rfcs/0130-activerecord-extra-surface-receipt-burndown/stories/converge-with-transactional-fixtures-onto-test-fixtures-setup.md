---
title: "converge-with-transactional-fixtures-onto-test-fixtures-setup"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-fixtures-helper-surface-onto-rails-fixtures`, which deleted the
wrapper surface `defineFixtures`, `defineJoinTableFixtures`, `throughJoinTableNames`
and `leaseFixtureConnectionFor` and moved every caller onto
`FixtureSet.createFixtures` (`activerecord/lib/active_record/fixtures.rb:640-676`, which
already groups sets by `model_class.connection_pool` at `:668`). `prepareModelFixtures` /
`prepareJoinTableFixtures` were re-pointed at `converge-fixture-set-insert-onto-table-rows`,
which owns folding them into `FixtureSet#table_rows`.

Two receipted names remain, both carrying
`@noRailsEquivalent CONVERGEABLE converge-with-transactional-fixtures-onto-test-fixtures-setup`:

- `withTransactionalFixtures` (`packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`)
  registers vitest `beforeEach`/`afterEach` hooks that open/roll back the fixture transaction.
  Rails' shape is `TestFixtures#before_setup` / `#after_teardown`
  (`activerecord/lib/active_record/test_fixtures.rb:9-18`) calling `setup_fixtures` /
  `teardown_fixtures` (`:113-160`), which call `setup_transactional_fixtures` /
  `teardown_transactional_fixtures` (`:170-212`) plus `setup_shared_connection_pool` /
  `teardown_shared_connection_pool` (`:220-251`). trails' body additionally carries a
  raw-adapter arm (`tm(adapter).beginTransaction` for pool-less adapters), a
  `fixtureScopeDepth` counter for nested describes, an `eagerWarmSchemaCache` option and a
  `usesTransaction` option — the last is Rails' `run_in_transaction?` (`:109-112`).
- `leaseFixtureConnection` (`packages/activerecord/src/test-fixtures/fixture-connection.ts`)
  is the default `getAdapter` passed to it (`test-fixtures.ts` `fixtures()`,
  `test-fixtures/use-transactional-tests.ts`, ~12 test files). Rails has no adapter getter:
  `setup_transactional_fixtures` walks `connection_handler.connection_pool_list(:writing)`
  and `pin_connection!` / `lease_connection`s each pool.

## Acceptance criteria

- The hook bodies are decomposed into `setupFixtures` / `teardownFixtures` /
  `setupTransactionalFixtures` / `teardownTransactionalFixtures` with Rails' control flow
  (`test_fixtures.rb:113-212`), reached from the vitest hooks the way `before_setup` /
  `after_teardown` reach them.
- `withTransactionalFixtures` and `leaseFixtureConnection` are deleted (callers moved onto
  `fixtures()` / `useTransactionalTests`) or renamed to the Rails spelling, receipts removed.
- The raw-adapter arm either converges or is filed as its own story with the Rails
  `file:line` it diverges from.
- `git grep converge-with-transactional-fixtures-onto-test-fixtures-setup` returns nothing;
  `parity:api:extra --package activerecord` gains no novel names.
