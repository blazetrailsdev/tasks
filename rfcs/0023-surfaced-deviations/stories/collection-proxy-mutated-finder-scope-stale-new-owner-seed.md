---
title: "Mutated CollectionProxy finder requery keeps stale 1=0 base when owner was new at mutation time"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-07-03T02:09:51Z"
assignee: "collection-proxy-mutated-finder-scope-stale-new-owner-seed"
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced while fixing `habtm-collection-first-null-for-symbol-keys`
(PR #4459). A `CollectionProxy`'s relation clauses are seeded ONCE at
construction; when the owner is a new record then, its FK is unresolvable and
the seed collapses to the `1=0` NullRelation
(`collection-proxy.ts` ctor around line 524-540, `noneBang()` path).

PR #4459 added `_finderScope()`
(`packages/activerecord/src/associations/collection-proxy.ts:_finderScope`),
which routes the bounded finder requeries (`first`/`last`/`take`/`find_nth`)
through the freshly-rebuilt `scope()` for an **unmutated** proxy, so the
now-persisted FK is picked up after save. But `_finderScope()` deliberately
returns `this` (the proxy's own diverged clauses) once a scope-mutator bang has
run (`_cpMutated === true`). If a proxy is mutated (`whereBang`/`orderBang`/…)
while the owner is STILL a new record, and the owner is then saved, the mutated
proxy's base is the stale `1=0` seed with the mutation layered on top — so
`owner.things.where(...).first()` can still return null on a non-empty
collection. Rails' `CollectionProxy` delegates every query to the live
`association.scope`, so the mutation is always applied on top of a
freshly-resolved FK.

This is a narrow residual (requires mutate-while-owner-new, then save, then
requery) and was out of scope for the null-first fix, which targeted the bare
proxy that `test_symbols_as_keys` exercises.

## Acceptance criteria

- [ ] A mutated `CollectionProxy` whose owner was a new record at mutation time
      resolves the owner's persisted FK on `first`/`last`/`take`/`find_nth`
      after `save` — the requery merges the mutation onto the freshly-rebuilt
      association scope, not onto the stale `1=0` seed.
- [ ] Rails-faithful: mirror `CollectionProxy` delegating queries to the live
      `association.scope` (rebuild scope + re-apply the proxy's accumulated
      relation mutations, rather than binding finder helpers to the stale
      copied clauses).
- [ ] Covered by a test exercising `owner.things.where(...).first()` where
      `owner` is new at the `.where(...)` call, then saved.
