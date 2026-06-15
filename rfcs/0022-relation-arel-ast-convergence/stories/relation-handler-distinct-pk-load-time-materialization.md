---
title: "Load-time deferred distinct-PK materialization for eager+limit/offset where-subqueries (MySQL IN-list parity)"
status: draft
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["relation-handler-distinct-pk-materialization"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of `relation-handler-distinct-pk-materialization`. Rails'
`PredicateBuilder::RelationHandler#call` (`relation_handler.rb`) routes an
eager-loading relation value through `apply_join_dependency`
(`finder_methods.rb:457`), which — when the relation **also has a limit/offset
and involves a collection reflection** — calls
`connection.distinct_relation_for_primary_key(relation)`
(`abstract/schema_statements.rb:1429`). That method **executes a query**
(`select_rows` of `SELECT DISTINCT <pk> … LIMIT …`), collects the ids, and
rewrites the relation to `where(pk => limited_ids)` with limit/offset cleared.

trails cannot do this where Rails does. `RelationHandler#call` →
`PredicateBuilder#build` → `buildWhereClause` → `.where()` is a **synchronous,
lazy, chainable** path (`.where()` returns a `Relation`, not a `Promise`).
Making `call`/`build` async would force `.where()` to return a `Promise` and
break the lazy-relation contract across the whole library — a larger parity
regression than the gap it closes. (Rails only gets away with a mid-`.where()`
query because Ruby DB calls block the thread; trails' async-lazy relations are
the deliberate, correct deviation.)

The materialization is **mandatory for parity, not optional**: MySQL forbids
`LIMIT` inside an `IN (...)` subquery, so a pure-AST `attribute.in(subquery.arel)`
fails on MySQL. Rails materializes to an id list precisely to dodge that — which
is why the faithful trails path must materialize too.

## Scope

Defer the distinct-PK materialization to **relation load time** (where trails is
already async), preserving observable SQL parity — only _when_ the inner query
fires moves from `.where()` to `.toArray()`/`.load()`:

- `RelationHandler#call` stays sync. For the eager-loading + limit/offset +
  collection-reflection case, record a deferred-materialization marker on the
  built predicate / outer relation carrying the inner relation, instead of
  embedding `attribute.in(inner.arel)`.
- Add a load-time hook in the relation load pipeline that, before final compile,
  `await`s `distinctRelationForPrimaryKey(inner)` (run the `SELECT DISTINCT <pk>
… LIMIT …`, collect ids) and substitutes `attribute.in([...ids])` (or
  `none!`/empty IN when no ids).
- Reuse the now-Rails-faithful `distinctRelationForPrimaryKey`
  (`abstract/schema-statements.ts`) fixed in story 1.

## Rails source

- `vendor/rails/activerecord/lib/active_record/relation/predicate_builder/relation_handler.rb`
- `vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457`
  (`apply_join_dependency`, `using_limitable_reflections?`).
- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1429`
  (`distinct_relation_for_primary_key`).

## Acceptance criteria

- [ ] `where(x: EagerModel.includes(:collection).limit(n))` materializes distinct
      PKs at load time and emits `x IN (<id list>)` on **all three adapters**
      (MySQL parity is the key assertion — no `LIMIT`-in-subquery).
- [ ] `.where()` stays synchronous/chainable; no public API returns a new Promise.
- [ ] Empty id set → `none!` semantics (empty result, no error).
- [ ] `test:compare` / `api:compare` delta ≥ 0.

## Notes

- Depends on story 1 (`relation-handler-distinct-pk-materialization`) landing the
  Rails-faithful `distinctRelationForPrimaryKey` + the sync no-limit eager join.
- Likely exceeds one 300-LOC PR (touches the relation load pipeline); split
  further via `pnpm tasks new` if so.
