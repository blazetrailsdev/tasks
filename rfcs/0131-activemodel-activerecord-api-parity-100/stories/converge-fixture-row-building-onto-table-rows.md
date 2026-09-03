---
title: "converge-fixture-row-building-onto-table-rows"
status: draft
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
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

`packages/activerecord/src/fixtures.ts` builds fixture rows through two
trails-invented helpers that Rails performs inline in
`ActiveRecord::FixtureSet#table_rows` / `TableRow#resolve_sti_reflections`
(`vendor/rails/activerecord/lib/active_record/fixtures.rb:742` onward):

- `resolveFixtureId(adapter, tableName, fixtureName)` — the "declared id, else
  pinned id, else `FixtureSet.identify(label)`" lookup. Rails has no such
  function; `TableRow#resolve_reference` reads the referenced row's primary key
  straight out of the fixture set it already holds.
- `resolveCompositeRefColumn(adapter, tableName, fixtureName, targetColumn,
  targetPkCols)` — the composite-key arm of the same lookup, which Rails gets
  for free because `composite_identify` returns the whole hash and the caller
  indexes it.

Both now call the Rails-named `FixtureSet.identify` /
`FixtureSet.compositeIdentify` (PR for
`converge-fixture-id-onto-fixture-set-identify`), so the naming divergence is
gone; what remains is that the surrounding row-building loop is not shaped like
`FixtureSet#table_rows`, which is why the two helpers exist at all. Both carry
`@noRailsEquivalent CONVERGEABLE` receipts pointing here.

## Acceptance criteria

- [ ] The fixture row-building loop mirrors `FixtureSet#table_rows` and
      `FixtureSet::TableRow` (`fixtures.rb:742-900`) closely enough that
      `resolveFixtureId` and `resolveCompositeRefColumn` have no work left to do.
- [ ] Both helpers are deleted along with their `@noRailsEquivalent` receipts.
- [ ] `pnpm parity:api:extra --package activerecord` shows the two names gone;
      the extra-surface mark is tightened, never raised.
