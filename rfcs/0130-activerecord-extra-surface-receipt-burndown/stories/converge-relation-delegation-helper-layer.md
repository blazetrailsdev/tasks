---
title: "converge-relation-delegation-helper-layer"
status: draft
updated: 2026-09-03
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation/delegation.ts` carries a helper layer around
`activerecord/lib/active_record/relation/delegation.rb` that Rails does not
have. After #TBD (RFC 0130 phase 1) the file's dead exports are gone and the
remainder carry `@noRailsEquivalent CONVERGEABLE` receipts pointing here. The
twelve names, and the Ruby they stand in for:

- `relationClassFor` is `@internal` and matches `relation_class_for(model)`
  (delegation.rb:141-143), which Rails parameterises by `self` — the relation
  class asking. trails instead has four per-family functions:
  `associationRelationClassFor`, `collectionProxyClassFor`,
  `disableJoinsAssociationRelationClassFor` and `relationClassFor`, each with
  its own `WeakMap`. Route 1: one `relationClassFor(model, klass)` over one
  cache, keyed the way `@relation_delegate_cache` is (delegation.rb:28-30).
- `wrapWithScopeProxy`, `classMethodDelegator` and `guardBaseMethodDelegation`
  are the three pieces `ClassSpecificRelation#method_missing`
  (delegation.rb:114-131) is one method of. The `!DelegateCache
.delegate_base_methods && Base.respond_to?` arm (delegation.rb:117-123) is
  `guardBaseMethodDelegation`'s whole body.
- `delegateArrayMethod`, `delegateEnumerableMethod` and
  `delegateRecordMethodSync` are the `delegate ... to: :records` line
  (delegation.rb:101-103) exploded into named dispatchers over
  `DELEGATED_ARRAY_METHODS` / `RECORD_DELEGATES`.
- `DelegationMethods` is a second mixin carrier beside the file's
  `interface Delegation`; `includeInto` is `delegate.include
generated_relation_methods` (delegation.rb:59); `initialize` on
  `DelegateCache` is `initialize_relation_delegate_cache`
  (delegation.rb:32-44) under a name Rails does not use.

## Acceptance criteria

- The four `*ClassFor` functions collapse into the single
  `relation_class_for`-shaped entry point, over one delegate cache.
- The `method_missing` trio is one ported method, or its pieces carry the Rails
  names of the branches they are.
- `DelegateCache#initialize` is renamed to its Rails name.
- `pnpm parity:api:extra --package activerecord --novel-only` shows
  `relation/delegation.ts` at 0 novel with no `@noRailsEquivalent` tag left in
  the file, and `parity:api:calls` / `:calls:args` / `:params` gain no rows.
