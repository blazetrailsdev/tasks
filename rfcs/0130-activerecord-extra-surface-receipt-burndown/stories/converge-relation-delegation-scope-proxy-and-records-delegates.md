---
title: "converge-relation-delegation-scope-proxy-and-records-delegates"
status: claimed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-15T15:50:15Z"
assignee: "await-disconnect-pool-from-pool-manager"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-relation-delegation-helper-layer`, which collapsed the
`*ClassFor` functions into `relationClassFor` over one `@relation_delegate_cache`
(`activerecord/lib/active_record/relation/delegation.rb:28-44,141-143`), ported
`GeneratedRelationMethods < Module` (`delegation.rb:74-95`) onto ruby-compat's
`Module`/`include`, and folded the Base guard and the class-method delegator
into `methodMissing` (`delegation.rb:114-131`).

Four `@noRailsEquivalent CONVERGEABLE` names remain in
`packages/activerecord/src/relation/delegation.ts`:

- `wrapWithScopeProxy` — the `Proxy` that reaches `methodMissing`. In Rails the
  `method_missing` is on the delegate class itself (`Class.new(klass) { include
ClassSpecificRelation }`, delegation.rb:35-37), so every per-model delegate
  answers it. Converging means installing that trap when the delegate is
  constructed (e.g. `Relation`'s constructor returning the proxy when
  `new.target` includes `ClassSpecificRelation`, so subclass constructor bodies
  such as `CollectionProxy#initialize`'s `extend(*extensions)`
  (associations/collection_proxy.rb) already see it) and deleting the explicit
  wraps in `relation.ts#clone`, `association-relation.ts`,
  `disable-joins-association-relation.ts`, `relation/query-methods.ts`
  `extendingBang` and `associations/collection-proxy.ts`. `associations.ts`
  `wrapCollectionProxy` layers a second trap over CollectionProxy and has to be
  reconciled with it.
- `delegateArrayMethod`, `delegateEnumerableMethod`, `delegateRecordMethodSync`
  — the `delegate ... to: :records` line (delegation.rb:101-103) plus
  `Relation`'s `include Enumerable` (relation.rb), exploded into dispatchers the
  two Proxy traps (`delegation.ts` and `associations.ts#wrapCollectionProxy`)
  consult. They should become real members of `Delegation` / the relation, not
  name-keyed lookups.

## Acceptance criteria

- `wrapWithScopeProxy`, `delegateArrayMethod`, `delegateEnumerableMethod` and
  `delegateRecordMethodSync` are gone; `method_missing` is reached from the
  delegate class the way `ClassSpecificRelation` includes it.
- `pnpm parity:api:extra --package activerecord` shows `relation/delegation.ts`
  with no `CONVERGEABLE` receipt left, and `parity:api:calls` /
  `:calls:args` / `:params` gain no rows.
