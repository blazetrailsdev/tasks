---
title: "converge-execute-grouped-calculation-body-to-rails-source-order"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
pr: 6716
claim: "2026-08-18T19:52:42Z"
assignee: "converge-execute-grouped-calculation-body-to-rails-source-order"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `wave-2c-grouped-calculation-and-query-method-stores`, which
retired the bespoke `groupedAggregate` helper by making its body
`executeGroupedCalculation` outright (12 of the 14 `execute_grouped_calculation`
call-set rows converged). What is left is the part that needs either a reindent
or a signature change elsewhere:

- **`with_connection` position.** calculations.rb:527 opens
  `model.with_connection do |connection|` around the _whole_ remainder of the
  body, so `with_connection` precedes `ColumnAliasTracker.new` (:528). trails
  calls it at the `select_all` (:556) instead, because the calculation entry
  points already run inside `inQueryConnection`'s `with_connection`. This is the
  live baseline row
  `execute_grouped_calculation | order:constructor,withConnection` in
  `scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json`.
- **`type_for` with a block.** calculations.rb:567-570 is
  `col_name.try(:type_caster) || type_for(col_name) { calculated_data.column_types.fetch(aliaz, Type.default_value) }`.
  trails' `typeFor` (`relation/calculations.ts`) takes no block, and
  `Base.typeForAttribute` (`base.ts:1255`) has no block parameter, so the port
  routes through the trails-only `pluckCastTypeForKnownColumn` +
  `qualifiedGroupFieldForModel` pair instead. Rails' block form is
  `attribute_registration.rb:43-51`:
  `block ? attribute_types.fetch(name, &block) : attribute_types[name]`.
  Live baseline rows: `execute_grouped_calculation | type_for` and
  `execute_grouped_calculation | fetch`.
- **trails-only extractions.** `qualifiedGroupFieldForModel` and
  `resolveGroupAssociation` in `relation/calculations.ts` have no Rails
  counterpart — Rails inlines both (`model._reflect_on_association(...)` +
  `association.belongs_to?` at :519-520). Inline them.
- **Source order.** `executeGroupedCalculation` currently sits where
  `groupedAggregate` lived (above `calculate`), not between
  `execute_simple_calculation` and `type_for` where calculations.rb:514 puts it.

## Acceptance criteria

- [ ] `with_connection` wraps the body from calculations.rb:527 onward; the
      `order:constructor,withConnection` baseline row is deleted by hand.
- [ ] `typeFor` and `Base.typeForAttribute` take Rails' optional block, and the
      key-type resolution is calculations.rb:567-570 verbatim; the `type_for`
      and `fetch` rows are deleted.
- [ ] `qualifiedGroupFieldForModel` / `resolveGroupAssociation` are inlined.
- [ ] `executeGroupedCalculation` sits in calculations.rb source order.
- [ ] Stale marks fixed with `pnpm parity:api:calls:tighten <shard>`. No
      `--write`, no reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PostgreSQL and
      MySQL/MariaDB lanes green.
