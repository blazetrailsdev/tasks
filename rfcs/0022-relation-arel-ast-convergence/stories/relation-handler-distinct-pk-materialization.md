---
title: "RelationHandler: live eager-loading apply_join_dependency + Rails-faithful distinctRelationForPrimaryKey (sync slice)"
status: in-progress
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 3383
claim: "2026-06-15T17:06:27Z"
assignee: "relation-handler-distinct-pk-materialization"
blocked-by: null
---

## Context

`PredicateBuilder::RelationHandler#call` (`relation_handler.rb`) routes an
eager-loading relation value through `apply_join_dependency` before building the
`attribute.in(value.arel)` predicate:

```ruby
def call(attribute, value)
  if value.eager_loading?
    value = value.send(:apply_join_dependency)
  end
  if value.select_values.empty?
    model = value.model
    if model.composite_primary_key?
      raise ArgumentError, "Cannot map composite primary key ... to #{attribute.name}"
    else
      value = value.select(value.table[model.primary_key])
    end
  end
  attribute.in(value.arel)
end
```

trails has two dead/inconsistent pieces of this feature on `main`:

1. **The eager-loading branch is dead.** `relation-handler.ts` calls
   `value.applyJoinDependencyForArel()` — **a method that does not exist
   anywhere** — so the `if value.eager_loading?` branch is a silent no-op and
   eager `includes`/`eager_load` on a where-subquery never become OUTER joins on
   its arel.
2. **`distinctRelationForPrimaryKey` is dead + buggy.** It is defined in
   `abstract/schema-statements.ts` (with PG/MySQL `columnsForDistinct` overrides
   and tests) but **called from nowhere**, and it passes bare primary-key
   _names_ to `columnsForDistinct` instead of compiled, table-qualified
   `visitor.compile(relation.table[column])` columns (Rails
   `schema_statements.rb:1430`), and uses `adapter.execute` instead of
   `selectRows`.

The full Rails behavior also materializes distinct PKs via a **synchronous query
mid-`.where()`** when the relation has limit/offset + a collection reflection.
trails' predicate-builder path (`call` → `build` → `buildWhereClause` →
`.where()`) is **synchronous/lazy/chainable**, so that branch cannot run here
without making `.where()` async. That async work is split into
`relation-handler-distinct-pk-load-time-materialization` (load-time deferral).
**This story is the synchronous slice only.**

## Scope

- Implement `applyJoinDependencyForArel` (the method `RelationHandler` already
  calls) for the **no-limit/offset** eager case: convert `includes`/`eager_load`
  associations to OUTER joins on the subquery's arel, mirroring
  `apply_join_dependency`'s join-dependency construction
  (`finder_methods.rb:457-461`) without the `distinct_relation_for_primary_key`
  branch.
- Fix `distinctRelationForPrimaryKey` (`abstract/schema-statements.ts`) to be
  Rails-faithful: build pk columns via `visitor.compile(relation.table[column])`
  (quoted, table-qualified), and read via `selectRows`. Add direct unit-test
  coverage (it is currently untested dead code).
- Align the composite-PK guard to raise the Rails `ArgumentError`-shaped message.
- Document the limit/offset materialization branch as
  **tracked-pending-convergence**, pointing at the load-time story.

## Out of scope

- The limit/offset distinct-PK materialization in `where()` (requires async
  load-time deferral; MySQL `IN (list)` parity). Tracked in
  `relation-handler-distinct-pk-load-time-materialization`.
- Removing the bespoke "single column" validation in `RelationHandler`
  (`relation-handler.ts:48-61`) — Rails has no such check, but it guards a real
  trails ambiguity; leave for a dedicated deviation review.

## Rails source

- `vendor/rails/activerecord/lib/active_record/relation/predicate_builder/relation_handler.rb`
- `vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457`
  (`apply_join_dependency`, `using_limitable_reflections?`).
- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1425`
  (`columns_for_distinct`, `distinct_relation_for_primary_key`).

## Acceptance criteria

- [ ] `RelationHandler`'s eager-loading branch is live: `where(x:
  Model.includes(:assoc).where(...))` converts the include to an OUTER join
      on the subquery arel (no `applyJoinDependencyForArel`-missing no-op).
- [ ] `distinctRelationForPrimaryKey` builds table-qualified compiled pk columns
      and reads via `selectRows`; covered by direct unit tests on SQLite (+ PG
      `columnsForDistinct` order-column path).
- [ ] No test renames; currently-green tests stay green. `test:compare` /
      `api:compare` delta ≥ 0.
- [ ] ≤300 LOC. Single PR from main, draft.
