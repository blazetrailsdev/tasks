---
title: "Hoist ensureSchemaLoaded and deferred distinct-PK materialization out of ids/pluck/calculation bodies"
status: draft
updated: 2026-08-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `ids` onto `with_connection` (PR #6570, RFC 0106).

`Relation#ids` (`packages/activerecord/src/relation.ts`) opens its
`with_connection` block with two awaits that Rails' body
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:388-401`)
has no counterpart for:

```ts
await this._model.ensureSchemaLoaded();
await relation._materializeDeferredDistinctPkPredicates();
```

Rails needs neither: Ruby resolves a model's columns lazily through
`method_missing` on the connection it already holds, and Rails materializes the
`distinct_relation_for_primary_key` subquery at `.where()`-build time
(`finder_methods.rb:463`) rather than at query time. PR #6570 moved both inside
the lease so they no longer flip it permanent, but they are still two extra
calls in a ported body, and the same pair recurs in `pluck`'s arm and in
`inQueryConnection` ([[retire-in-query-connection-calculation-decorator]]).

## Converged shape

Hoist both out of the ported bodies:

- `ensureSchemaLoaded` — the schema reflection belongs at the point trails
  already reflects for every other read path, not inside each calculation body.
  Check whether the query path can reach `loadSchema` through the connection it
  leases (`model-schema.ts` `loadSchemaFromAdapter`, whose `reflectionAdapter`
  already prefers `threadedConnectionFor`) so the ported bodies need no await.
- `_materializeDeferredDistinctPkPredicates` — materialize at `.where()`-build
  time, which is where Rails does it, so no ported body carries the call. The
  existing comment at `relation/calculations.ts`' decorator says exactly this
  ("Rails materializes these at `.where()`-build time") and then does it at
  query time anyway.

Both are cross-cutting, so size the story around `ids` + `pluck` +
`inQueryConnection` and file any further callers as their own rows rather than
widening this one.

## Acceptance criteria

- [ ] `ids`' body has no `ensureSchemaLoaded` / materialization await; it reads
      as `calculations.rb:388-401` line for line.
- [ ] `pluck` and the calculation entry points lose the same pair.
- [ ] Deferred distinct-PK predicates still resolve to a literal id list before
      any arel compiles (the `where with eager-loading limited collection
relation subquery materializes distinct primary keys at load time` test
      in `relation.trails.test.ts` stays green).
- [ ] A first query against a never-reflected model still reflects, and still
      does not permanently lease under
      `permanent_connection_checkout = :deprecated | :disallowed` (the
      `common APIs don't permanently hold a connection...` assertions in
      `connection-handling.test.ts` cover `ids` and `pluck`).
