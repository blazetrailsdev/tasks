---
title: "apply_join_dependency delegates to the adapter's distinct_relation_for_primary_key instead of the bespoke _materializeLimitedIds"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `distinctRelationForPrimaryKey` for RFC 0099 in
PR #6363.

The adapter method is fully ported and, as of #6363, matches Rails line for
line — including `select_rows(limited.arel, "SQL")`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1429-1450`).
**It has zero callers in the whole repo.** `grep -rn distinctRelationForPrimaryKey
packages/` returns only its definition and its own unit test.

Rails has exactly one caller, and it is the eager-load limit/offset arm of
`apply_join_dependency`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:473-477`):

```ruby
relation = skip_query_cache_if_necessary do
  model.with_connection do |c|
    c.distinct_relation_for_primary_key(relation)
  end
end
```

trails reimplements that on the Relation instead, as the private
`_materializeLimitedIds` (`packages/activerecord/src/relation.ts:5158-5165`)
plus its `_distinctSelectForLimitedIds` helper (`:5180`), called from four
sites (`:2757`, `:3592`, `:4851`, `:6597`). The bespoke pair:

- executes through `this._conn().execute(idSql, idBinds)` rather than
  `select_rows`, so it does not ride the cached read path;
- returns a bare id array and leaves each call site to rebuild the
  `WHERE pk IN (ids)` rewrite and the limit/offset clear that Rails does once
  inside the adapter method;
- hardcodes a single-column `basePk`, which is why the composite-PK arm has to
  raise `NotImplementedError` at `relation.ts:3579-3586` — the adapter method
  handles `Array(relation.primary_key)` natively via zip/transpose.

## Converged shape

`applyJoinDependency`'s non-limitable limit/offset arm calls the adapter's
`distinctRelationForPrimaryKey(relation)` and uses the relation it returns,
as `finder_methods.rb:475` does. `_materializeLimitedIds` and
`_distinctSelectForLimitedIds` are deleted once the four call sites are routed
through it, along with the `@noRailsEquivalent`/citation comments that carry
them.

## Acceptance criteria

1. The eager-load limit/offset arm delegates to the adapter method rather than
   materializing ids on the Relation, matching `finder_methods.rb:473-477`.
2. `_materializeLimitedIds` and `_distinctSelectForLimitedIds` are gone; no
   remaining caller rebuilds the `WHERE pk IN (ids)` + limit/offset clear that
   `schema_statements.rb:1443-1449` already does.
3. The composite-PK `NotImplementedError` at `relation.ts:3579-3586` is
   removed, since the adapter method supports composite primary keys. This
   subsumes part of `converge-composite-pk-distinct-relation-materialization`
   — coordinate with that story rather than duplicating it.
4. `pnpm parity:api:calls` picks up the `distinct_relation_for_primary_key`
   call at the Rails call site; `pnpm parity:test` delta non-negative; PG /
   MySQL / SQLite lanes green.

## Related

- `converge-composite-pk-distinct-relation-materialization` (0023) — the
  composite-PK half.
- `converge-relation-subquery-distinct-pk-materialization` (0023) — the
  sync-predicate-builder-blocked sibling site.
- `converge-eager-count-distinct-pk-materialization-into-apply-join-dependency`
  (0023) and `-tosql-` — fold OTHER sites into `applyJoinDependency`; this
  story is about `applyJoinDependency` itself delegating to the adapter.
