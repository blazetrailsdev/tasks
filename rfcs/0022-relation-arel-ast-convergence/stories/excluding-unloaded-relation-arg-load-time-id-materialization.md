---
title: "excluding/without: materialize unloaded relation args to literal ids at load time (not a subquery)"
status: done
updated: 2026-06-29
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: 4286
claim: "2026-06-29T18:53:46Z"
assignee: "excluding-unloaded-relation-arg-load-time-id-materialization"
blocked-by: null
---

## Context

Surfaced while converging `excluding.test.ts` (RFC 0019, PR #4165).

Rails `QueryMethods#excluding` (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1574-1591`) materializes its
Relation arguments eagerly:

```ruby
spawn.excluding!(records + relations.flat_map(&:ids))
```

`relations.flat_map(&:ids)` runs a separate `SELECT <pk>` query and produces an
**array of integer ids**, so `excluding!` builds a literal predicate
`id NOT IN (1, 2, 3)`. `Relation#ids` (`calculations.rb:371`) returns the cached
`records.map(&:id)` when the relation is loaded and re-queries otherwise. The
Rails tests assert this directly: `assert_queries_count 2` for an unloaded
relation arg, `assert_queries_count 1` for a loaded one
(`test/cases/excluding_test.rb:36-50,72-89`).

trails today (`packages/activerecord/src/relation.ts` `excluding`/`without` +
`_excludingArgs`, and `relation/query-methods.ts` `excludingBang`):

- **Loaded relation arg** — already Rails-faithful: `_excludingArgs` spreads
  `rel._records` synchronously, yielding literal ids (`NOT IN (1,2,3)`, no extra
  query).
- **Unloaded relation arg** — diverges: it is passed through to the predicate
  builder's `PredicateBuilder::RelationHandler`
  (`relation/predicate-builder/relation-handler.ts`), emitting
  `id NOT IN (SELECT <pk> FROM ...)` — a **subquery, single query**, not Rails'
  literal IN-list after a materializing query.

Same result set (barring concurrent modification between the two queries), and
the subquery's `SELECT posts.id FROM` still satisfies Rails'
`assert_queries_match` shape regex, so the ported tests pass. But the emitted SQL
(literal IN-list vs subquery) and query count (2 vs 1) diverge.

**Do NOT fix this by making `excluding`/`without` async.** That would return
`Promise<Relation>` and break the synchronous chainable query-builder contract
(`Post.excluding(rel).where(...).order(...)`), diverging from every other
query-builder method. The codebase already has the faithful synchronous tool:
the deferred-materialization markers `DeferredDistinctPkIn` /
`DeferredDistinctPkNotIn` in `relation/predicate-builder/relation-handler.ts`
(RFC 0022, story `relation-handler-distinct-pk-load-time-materialization`). Their
comment: _"emit a deferred marker carrying the inner relation; the relation load
pipeline materializes the ids and substitutes a literal `attribute.in([...ids])`
before compile."_ Route an unloaded `excluding` relation arg through the same
deferred path so the load pipeline runs the id-select and substitutes a literal
`NOT IN (1,2,3)`.

Also update the now-imprecise comment on `excludingBang`
(`relation/query-methods.ts`), which wrongly implies async is the only path to
eager materialization and that the subquery is fully equivalent (it elides the
literal-vs-subquery and query-count divergence).

## Acceptance criteria

- [ ] An **unloaded** Relation arg to `excluding`/`without` materializes its ids
      at load time (via the deferred-marker pattern) and emits a literal
      `id NOT IN (1, 2, 3)`, not a `NOT IN (SELECT ...)` subquery — matching
      Rails `flat_map(&:ids)` SQL shape and the `assert_queries_count 2`
      semantics.
- [ ] A **loaded** Relation arg stays single-query with literal ids (no
      regression; matches `assert_queries_count 1`).
- [ ] `excluding`/`without` remain synchronous and chainable (no `Promise`
      return).
- [ ] Correct the `excludingBang` comment to describe the deferred-materialization
      convergence path instead of the async framing.
- [ ] `excluding.test.ts` still passes; consider adding query-count assertions if
      the harness gains `assert_queries_count` parity.
