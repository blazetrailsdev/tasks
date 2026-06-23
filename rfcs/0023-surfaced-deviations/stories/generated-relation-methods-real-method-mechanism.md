---
title: "Delegation: install generated relation methods as real methods (Rails GeneratedRelationMethods module) instead of WeakMap side-table"
status: ready
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3998 (story `delegation-generate-relation-method-cache`) ported Rails'
cache-after-first-call for delegated class methods (delegation.rb:118-131) and
the `uncacheable_methods` set difference (delegation.rb:17-21). The _observable_
behavior is faithful, but the underlying **caching mechanism is a structural
deviation** from Rails:

- **Rails** creates a per-model `GeneratedRelationMethods` _module_
  (`delegation.rb:64-90`) and `include`s it into each dynamically-built delegate
  subclass (Relation / CollectionProxy / AssociationRelation /
  DisableJoinsAssociationRelation) via `include_relation_methods` in
  `initialize_relation_delegate_cache` (`delegation.rb:32-45`). Cached methods
  become **real methods** resolved by normal Ruby method lookup, so
  `method_missing` is never re-entered.
- **trails** has no `include`-into-subclass, so the cache lives in a per-model
  **WeakMap side-table** (`_generatedMethodsByModel` in
  `packages/activerecord/src/relation/delegation.ts`) consulted inside the
  Proxy `get` trap (`wrapWithScopeProxy`) and `wrapCollectionProxy`
  (`associations.ts`).

Consequences of the deviation (all currently benign, documented in PR #3998):

1. The `uncacheableMethods` gate is **not strictly load-bearing** in trails:
   `Reflect.get(target, prop)` returns the proxy's real method _before_ the
   WeakMap lookup, so a generated copy can never clobber a subclass method. We
   implemented the gate purely for fidelity. In Rails it IS load-bearing
   (the shared module would clobber).
2. The guard (`guardBaseMethodDelegation`) re-runs on every cached call
   (cache-then-guard), whereas Rails guards-then-never-caches. Same observable
   result.
3. Each cached call still routes through the Proxy `get` trap + a Map lookup
   rather than a real compiled method — a perf delta vs Rails' direct method
   dispatch.

## Acceptance criteria

- [ ] Evaluate replacing the `_generatedMethodsByModel` WeakMap side-table with
      **real generated methods** installed on a per-model delegate carrier
      (e.g. `Object.defineProperty` on a per-model object whose prototype the
      proxy targets, or an analogous mechanism), mirroring Rails'
      `GeneratedRelationMethods` module included into the delegate subclasses.
- [ ] If adopted, the `uncacheableMethods` gate becomes correctness-relevant
      (no `Reflect.get` shadow ahead of it) — verify the clobber-prevention
      semantics that `DelegationCachingTest` guards still hold.
- [ ] No observable behavior change for existing delegation/scoping/collection-
      proxy tests; `api:compare` / `test:compare` deltas non-negative.
- [ ] If the refactor is deemed not worth the architectural churn, record the
      decision (tracked-pending-convergence) with the rationale rather than
      silently closing.

Note: scope caching is intentionally out of scope here — Rails caches named
scopes as generated relation methods too, but trails routes scopes through the
separate `_scopes` registry (with RFC 0030 per-association memoization). That
split is a distinct, pre-existing design choice.
