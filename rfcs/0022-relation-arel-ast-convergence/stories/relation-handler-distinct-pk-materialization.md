---
title: "relation-handler-distinct-pk-materialization"
status: draft
updated: 2026-06-13
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Spun out of [[relation-arel-build-arel-convergence]] (PR #3186). When a
relation value passed to `where(id: …)` is eager-loading with a limit/offset
over a **collection** (non-limitable) reflection — e.g.
`Widget.where(id: Author.eagerLoad(:posts).where("posts.x = 1").limit(5))` —
Rails `apply_join_dependency` (finder_methods.rb:457) keeps the join
dependency and replaces the relation with `distinct_relation_for_primary_key`
(schema_statements.rb:1429), which **executes a query** (`select_rows`) to
materialize the limited DISTINCT primary keys, then rewrites the relation as
`where(pk: ids)` with limit/offset cleared. This is required because a bare
`IN (SELECT … LIMIT n)` over a row-multiplying join limits joined rows rather
than parents, and MySQL rejects `IN`+`LIMIT` subqueries outright.

trails' `PredicateBuilder` is synchronous and side-effect-free, so it cannot
run that query mid-construction. Rather than emit non-parity SQL, the
convergence PR **rejects** this combination explicitly
(`NotImplementedError` from `relation.ts#applyJoinDependencyForArel`) — every
other eager-subquery shape (no limit, or limit over limitable
belongs_to/has_one reflections) converts the eager-load to a `LEFT OUTER JOIN`
faithfully. This story is to lift the restriction by mirroring Rails'
materialized-ID behavior:

- Execute the limited DISTINCT-pk query (honoring
  `columns_for_distinct(..., order_values)` for ordered relations), rewrite the
  value relation as `where(pk: ids)`, and clear limit/offset — so the subquery
  is portable (works on MySQL/MariaDB, which reject `IN (SELECT … LIMIT n)`).
- This requires the predicate-builder / `RelationHandler` path to support an
  async/materializing step, or pre-materialization at `where` time.

See `relation.ts#applyJoinDependencyForArel` and
`predicate-builder/relation-handler.ts`.

## Acceptance criteria

- [ ] `where(id: rel.eagerLoad(collectionAssoc).limit(n))` materializes the
      limited distinct primary keys (mirroring `distinct_relation_for_primary_key`)
      so the subquery is portable (works on MySQL) and bounds distinct parents.
- [ ] Joined-table predicates/orders on the eager relation are preserved.
- [ ] Cite `finder_methods.rb` / `schema_statements.rb` line ranges; no test
      renames; `test:compare`/`api:compare` deltas ≥ 0.
