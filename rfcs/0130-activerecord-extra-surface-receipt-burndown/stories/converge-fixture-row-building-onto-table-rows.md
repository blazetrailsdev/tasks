---
title: "converge-fixture-row-building-onto-table-rows"
status: claimed
updated: 2026-09-11
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-09-11T20:21:38Z"
assignee: "converge-ar-config-module-seats-onto-their-rails-files"
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
- [ ] The three remaining `fixture_set/*.rb` files land as modules mirroring the
      Rails files, one Rails method per TS method:
      `fixture_set/table_rows.ts` (`TableRows#initialize` `:6-19`, `#to_hash`
      `:21-23`), `fixture_set/table_row.ts` (`TableRow#initialize` `:8-16` plus
      Rails' private `fill_row_model_attributes`, `resolve_sti_reflections`,
      `fill_timestamps`, `resolve_enums`, `add_join_records`,
      `resolve_fk_reflection`), and `fixture_set/model_metadata.ts`
      (`#primary_key_name`, `#primary_key_type`, `#has_primary_key_column?`,
      `#timestamp_column_names`, `#inheritance_column_name`, `:8-40`) — the
      readers as accessor properties, since they are zero-arg Ruby readers.
- [ ] The three `pattern:` rows for those files in
      `scripts/parity/unported-files/unscoped.ts` are deleted (added by #7655
      when it narrowed the blanket `pattern: "fixture_set"` row), and
      `parity:api` credits all three.
- [ ] The `@noRailsEquivalent CONVERGEABLE` receipt at `fixtures.ts:74`, which
      names `FixtureSet#table_rows` (`fixtures.rb:742`), is deleted rather than
      reworded.
- [ ] Retiring the `#table_rows` case-level exclusion rows in `unscoped.ts`
      (the `fixtures_test.rb:668,687,695` cases, excluded because trails'
      `FixtureSet` at `fixtures.ts:896` is static-only with no instance to call
      `#table_rows` on) stays OUT of scope; file it separately.
