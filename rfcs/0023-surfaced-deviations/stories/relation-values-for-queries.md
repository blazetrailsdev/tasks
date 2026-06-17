---
title: "Add Relation#valuesForQueries; drop preloader LoaderQuery toSql fallback"
status: ready
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during RFC 0030 story preload-extending-grouping (PR #3533). Rails'
`Relation#values_for_queries` (`vendor/rails/activerecord/lib/active_record/relation.rb:1286`)
returns `@values.except(:extending, :skip_query_cache, :strict_loading)` and is
the canonical key the preloader uses to decide whether two loaders coalesce
(`Preloader::Association::LoaderQuery#eql?`/`#hash`).

trails' `LoaderQuery._valuesForQueries`
(`packages/activerecord/src/associations/preloader/association.ts:431`) has no
real `valuesForQueries()` on `Relation` to call, so it falls to a heuristic
fallback: count where-predicates/order-values and otherwise serialize `toSql()`.
This happens to coalesce correctly for the extending case (both scopes produce
`where=0, order=0` → `""`), but it is a deviation: any scope difference that
does not change `toSql` (or any extending/skip_query_cache/strict_loading
difference that DOES leak into toSql) could group/split wrongly.

## Acceptance criteria

- [ ] Add `valuesForQueries()` to `Relation` returning its query values minus
      `extending`, `skipQueryCache`, `strictLoading` (mirror Rails relation.rb:1286).
- [ ] `LoaderQuery._valuesForQueries` consumes it directly, dropping the
      toSql/where-count fallback heuristic.
- [ ] Existing preloader grouping tests (`preload groups queries with same
scope/sql at second level`) still pass.
