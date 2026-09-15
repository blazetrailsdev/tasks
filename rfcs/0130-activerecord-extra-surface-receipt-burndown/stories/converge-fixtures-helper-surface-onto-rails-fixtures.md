---
title: "converge-fixtures-helper-surface-onto-rails-fixtures"
status: draft
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

Split out of `fold-receipted-activerecord-root-and-adapter-names-remainder`, whose
PR converged `parseTouchArgs` / `parseTouchAllArgs` / `parseCounterCacheTouch`
(onto `extract_options!` — persistence.rb:793, relation.rb:969, touch_later.rb:38,
counter_cache.rb:61-66), deleted the callerless `savepoint`, and moved
`DisallowedClass` (a `Psych` class, not a Rails one) to `activesupport/src/yaml.ts`.
That story carried ~50 receipts across 29 files; this one owns the subset below.

Each name still carries
`@noRailsEquivalent CONVERGEABLE converge-fixtures-helper-surface-onto-rails-fixtures`: live trails surface with no
Rails `def` behind it. Each must either fold into the Rails method its callers
stand in for (citing the `vendor/rails` `file:line`) or be renamed to the Rails
spelling.

## Sites

- `packages/activerecord/src/fixtures.ts`
- `packages/activerecord/src/test-fixtures/fixture-connection.ts`
- `packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`

`fixtures.ts` and `test-fixtures/` carry a trails-invented fixture-definition
API (`defineFixtures`, `prepareModelFixtures`, `defineJoinTableFixtures`,
`prepareJoinTableFixtures`, `throughJoinTableNames`) alongside the ported
`ActiveRecord::FixtureSet`. Rails has `FixtureSet.create_fixtures`
(`activerecord/lib/active_record/fixtures.rb:640-676`), `FixtureSet#table_rows`
(`:832-841`) and `TestFixtures` (`activerecord/lib/active_record/test_fixtures.rb`);
the HABTM join-table rows Rails builds inside `TableRows`
(`fixture_set/table_rows.rb:23-48`), not through a separate `defineJoinTable*`
pair.

## Acceptance criteria

- Every receipted name listed above is deleted (callers moved onto the Rails
  method) or renamed to the Rails spelling, with its receipt removed in the same
  change.
- `git grep converge-fixtures-helper-surface-onto-rails-fixtures` returns nothing.
- `pnpm parity:api:extra --package activerecord --novel-only` stays at 0 novel;
  `parity:api:calls` / `:args` gain no rows.
