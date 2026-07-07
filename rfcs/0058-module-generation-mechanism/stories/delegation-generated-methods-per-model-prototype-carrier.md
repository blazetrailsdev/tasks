---
title: "Delegation: install generated relation methods via per-model prototype carriers (deferred mechanism convergence)"
status: claimed
updated: 2026-07-07
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 18
pr: null
claim: "2026-07-07T00:57:22Z"
assignee: "delegation-generated-methods-per-model-prototype-carrier"
blocked-by: null
---

## Context

Follow-up to `generated-relation-methods-real-method-mechanism` (RFC 0023),
which **evaluated** replacing the per-model `_generatedMethodsByModel` WeakMap
side-table with real generated methods (Rails' `GeneratedRelationMethods`
module). The evaluation deferred the mechanism convergence — documented as a
`Deviation (tracked-pending-convergence)` in
`packages/activerecord/src/relation/delegation.ts` — because a faithful port
requires structural churn on the relation hot path. This story tracks the
actual implementation if/when it is prioritized.

### Why deferred (rationale captured now)

Rails creates ONE per-model `GeneratedRelationMethods` module
(`delegation.rb:64-90`) and `include`s it into all four dynamically-built
delegate subclasses — Relation / CollectionProxy / AssociationRelation /
DisableJoinsAssociationRelation (`delegation.rb:32-45`). Generated methods
become real methods resolved by normal Ruby method lookup.

trails relations are **not per-model subclasses**: every model shares the same
`Relation` / `CollectionProxy` classes, dispatched through a `Proxy` `get`
trap. To make generated methods "real methods resolved by normal lookup" we
would need, per model, a prototype carrier inserted into the prototype chain of
relation/collection-proxy/association-relation/disable-joins instances. A
single carrier object cannot serve all four chains (one object has one
`[[Prototype]]`), so the faithful port needs **four per-model carriers** fed by
one `generate()`, plus `Object.setPrototypeOf(...)` on every relation/proxy at
construction time.

Consequences that made deferral the right call:

- `Object.setPrototypeOf` on the relation construction hot path is a known V8
  megamorphic deopt — it would very likely make the perf delta cited as the
  only non-fidelity motivation (consequence #3 in the parent story) **worse**,
  not better.
- High regression risk around the exact clobbering the `uncacheableMethods`
  gate prevents (a generated `target` on a shared carrier above
  `CollectionProxy.prototype` would shadow `CollectionProxy#target`).
- Observable behavior is already faithful: all delegation/scoping/collection-
  proxy tests pass, and the `uncacheableMethods` gate + cache-after-first-call
  are already implemented (PR #3998 + the parent story). The deviation is
  mechanism-only, not behavior.

## Acceptance criteria

- [ ] Implement per-model prototype carriers (one per delegate class:
      Relation / CollectionProxy / AssociationRelation /
      DisableJoinsAssociationRelation) fed by a single per-model generate, so
      generated relation methods resolve as real methods via prototype lookup
      (mirroring `include GeneratedRelationMethods`), removing the
      `_generatedMethodsByModel` WeakMap side-table and the explicit
      lookup branches in `delegation.ts` / `associations.ts`.
- [ ] The `uncacheableMethods` gate becomes correctness-relevant (no
      `Reflect.get` shadow ahead of it); `DelegationCachingTest`
      clobber-prevention still holds.
- [ ] Benchmark the relation construction hot path: the `setPrototypeOf`
      approach must not regress relation/proxy build throughput, or use an
      alternative carrier mechanism that avoids per-instance prototype mutation.
- [ ] No observable behavior change; `api:compare` / `test:compare` deltas
      non-negative.
