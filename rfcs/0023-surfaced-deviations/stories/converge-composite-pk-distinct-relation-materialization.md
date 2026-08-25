---
title: "converge-composite-pk-distinct-relation-materialization"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into route-apply-join-dependency-through-distinct-relation-for-primary-key (its AC 3 already subsumes the composite-PK arm; the adapter distinctRelationForPrimaryKey handles Array(primary_key) natively)"
---

## Context

`composite-pk-distinct-relation-materialization` (RFC 0053) was **closed
without a PR** — RFC 0053 itself is closed — but the gap it described is still
in the tree at four sites, all citing it as the tracker:

- `packages/activerecord/src/relation.ts:3594-3600` — `pluck` over an
  eager-loaded relation with limit/offset over a collection association.
- `packages/activerecord/src/relation.ts:6609-6613` — the `cache_version`
  path's mirror of the same branch.
- `packages/activerecord/src/relation/cpk-eager-pluck-cache-version-composite-fk-collection.trails.test.ts:126-138`
  — the test that pins the explicit-error behaviour.

Rails materializes the limited DISTINCT primary keys via
`distinct_relation_for_primary_key` (`finder_methods.rb:463`, executing
`select_rows` at `schema_statements.rb:1434`) before joining. trails'
`_materializeLimitedIds` is Rails' zip/transpose over `Array(primary_key)` but
has no composite support, so a composite base PK would emit a wrong
single-column `"col1,col2"` predicate. Rather than that, the branches raise
`NotImplementedError` explicitly.

Note `project_composite_pk_reverse_order_emits_broken_sql_in_rails_too` and
`project_cpk_orders_composite_is_model_level_not_db` before assuming Rails is
correct on every composite shape here.

## Acceptance criteria

- `_materializeLimitedIds` handles a composite primary key, so both relation.ts
  branches materialize limited DISTINCT PKs like Rails instead of raising.
- The `.trails.test.ts` cover is converged to assert the materialized result
  rather than the `NotImplementedError`, or is replaced by the Rails-named test
  it stands in for.
- All four stale `composite-pk-distinct-relation-materialization` citations are
  removed.
