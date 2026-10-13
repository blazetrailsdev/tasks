---
title: "batches-and-calculations-carry-rails-private-sections"
status: ready
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

Left over from `delegation-test-derives-querying-methods-from-module-methods`,
which made `publicInstanceMethods(Mod, false)` answer Rails' public list for all
five query modules but did not give two of them their full section record.

- `packages/activerecord/src/relation/batches.ts` declares `Batches` as a
  `class` whose prototype holds the three public methods (`findEach`,
  `findInBatches`, `inBatches`) and whose statics hold `ORDER_IGNORE_MESSAGE` /
  `DEFAULT_ORDER`. Rails' `ActiveRecord::Batches`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches.rb:6`)
  is a module with a `private` section at `:304-470`. The eleven private methods
  are already top-level functions in `batches.ts`, but nothing records them as
  the module's private section, and `SpawnMethods` / `QueryMethods` /
  `FinderMethods` are all `defineModule`d objects. Converting means moving the
  three class methods to top-level `this`-typed functions (a ~250-line dedent),
  finding a seat for the two constants, and updating `include(Relation, Batches)`.
- `packages/activerecord/src/relation/calculations.ts` now
  `defineModule`s only its public section. Rails' `protected`
  `aggregate_column` (`calculations.rb:413-423`) and the private section
  (`:425-680`: `all_attributes?`, `has_include?`, `perform_calculation`,
  `distinct_select?`, `operation_over_aggregate_column`,
  `execute_simple_calculation`, `execute_grouped_calculation`, `type_for`,
  `lookup_cast_type_from_join_dependencies`, `type_cast_pluck_values`,
  `type_cast_calculated_value`, `select_for_count`, `build_count_subquery?`,
  `build_count_subquery`) are ported as free functions taking `rel` as their
  first parameter rather than `this`-typed module members, so they are in no
  section and `relation.aggregate_column(column_name)` (`calculations.rb:668`)
  is not a member call.

## Acceptance criteria

- [ ] `Batches` is a `defineModule`d object with Rails' public and private
      sections; `Batches::ORDER_IGNORE_MESSAGE` and `DEFAULT_ORDER` keep a
      Rails-named seat.
- [ ] `Calculations`' protected and private methods are `this`-typed members of
      its `defineModule` sections, called as Rails calls them, with no `rel`
      first parameter.
- [ ] `pnpm vitest run packages/activerecord/src/relation/delegation.test.ts packages/activerecord/src/batches.test.ts packages/activerecord/src/calculations.test.ts`
      is green, and `pnpm parity:api:calls` / `pnpm parity:api:params` do not regress.
