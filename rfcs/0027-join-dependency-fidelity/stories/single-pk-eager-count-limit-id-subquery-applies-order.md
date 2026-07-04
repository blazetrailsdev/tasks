---
title: "Single-PK eager-count limit id subquery must apply order (distinct_relation_for_primary_key)"
status: ready
updated: 2026-07-04
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging composite-key eager count onto build_joins (PR #4549,
`converge-composite-key-eager-count-aggregate-onto-build-joins-emitter`).

The **single-PK** eager-count limit/offset branch in
`packages/activerecord/src/relation/calculations.ts` (~lines 724-748) builds the
`SELECT DISTINCT <pk> ... LIMIT/OFFSET` id-materialization subquery but applies
only joins, wheres, from, take, and skip — it never calls
`_applyOrderToManager(idSubquery, table)`. Rails
`distinct_relation_for_primary_key`
(active_record/connection_adapters/abstract/schema_statements.rb:1429-1452)
instead builds the limited relation via
`columns_for_distinct(primary_key_columns, relation.order_values)` +
`reselect(values).distinct!`, i.e. it **retains the relation's `order_values`**
so the LIMIT/OFFSET selects a deterministic, Rails-ordered set of primary keys
before the re-count.

Without the order, `Model.eager_load(:assoc).order(:col).limit(n).count(:col2)`
materializes an arbitrary limited id set on the single-PK path, so the
subsequent `COUNT(DISTINCT col2)` over `pk IN (<ids>)` can diverge from Rails
whenever the ordered vs unordered top-n rows differ.

The composite-PK sibling added in PR #4549 (same file, the
`if (column != null && column !== "*")` limit branch) DID apply
`_applyOrderToManager(idSubquery, table)` — this story converges the single-PK
path to match.

trails/Rails refs:

- packages/activerecord/src/relation/calculations.ts (single-PK eager-count
  limit/offset id subquery; composite-PK sibling applies order)
- vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb
  (`distinct_relation_for_primary_key` :1429-1452 — `columns_for_distinct(..., order_values)`)
- vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb
  (`apply_join_dependency` :457-485)

## Acceptance criteria

- [ ] The single-PK eager-count limit/offset id subquery applies
      `_applyOrderToManager(idSubquery, table)` before take/skip, mirroring
      Rails `distinct_relation_for_primary_key` retaining `order_values`.
- [ ] Add a test: `eager_load(:assoc).order(:col).limit(n).count(:other)` returns
      the count over the Rails-ordered top-n rows (constructed so ordered vs
      unordered top-n differ), verified cross-adapter.
