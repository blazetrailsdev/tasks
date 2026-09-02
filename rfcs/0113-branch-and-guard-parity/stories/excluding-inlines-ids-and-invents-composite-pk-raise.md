---
title: "excluding inlines Relation#ids and invents a composite-primary-key raise"
status: in-progress
updated: 2026-09-02
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 17
pr: 7391
claim: "2026-09-02T14:04:19Z"
assignee: "report-noRailsEquivalent-tags-that-cover-no-extra"
blocked-by: null
closed-reason: null
---

# `excluding` inlines `ids` and invents a composite-primary-key raise

## Context

Rails' `excluding` is
`spawn.excluding!(records + relations.flat_map(&:ids))`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1574-1585`),
and `excluding!` is three lines building an inverted predicate
(`query_methods.rb:1587-1591`). It has no composite-primary-key branch at all.

trails' `excludingWithCallee` (`packages/activerecord/src/relation/query-methods.ts`,
around the `flatMappedIds` loop) instead re-implements `Relation#ids`
(`calculations.rb:371-380`) inline — reading `relation.model.primaryKey`,
rebuilding `Array(primary_key)`, and mapping `_readAttribute` per record — plus
a `deferredRelations` split for relations that are not yet loaded, because
`Relation#ids` is `async` in trails while `excluding` is sync.

`excludingBang` then opens with a trails-invented raise:

```ts
if (Array.isArray(primaryKey)) {
  throw new Error("excluding does not support models with composite primary keys");
}
```

Rails has no such guard and no such message; a composite-PK model goes through
`predicate_builder[primary_key, records]` like any other.

Found while converging the `Array(primary_key)` nil arm in PR #7273 (the
inlined copy had its own dropped nil arm precisely because it is a copy).

## Converged shape

- Call the relation's own `ids` where Rails does, so there is one implementation
  of `Array(primary_key)` / `.one?` rather than two; the sync/async split is the
  real obstacle and is what this story has to solve (a settled trails idiom, not
  a second inline copy).
- Delete the `Array.isArray(primaryKey)` raise in `excludingBang` and let the
  predicate builder handle a composite key, as `query_methods.rb:1588` does.

## Acceptance criteria

- [ ] `excludingWithCallee` no longer carries its own copy of `ids`' body.
- [ ] `excludingBang` has no composite-primary-key raise; a composite-PK model
      excludes through the predicate builder.
- [ ] Tests cover a composite-PK `excluding`.
