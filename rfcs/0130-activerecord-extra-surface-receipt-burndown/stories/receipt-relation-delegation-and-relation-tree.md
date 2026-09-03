---
title: "relation/ tree: resolve 48 novel names, 15 of them in relation/delegation.ts"
status: done
updated: 2026-09-03
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 300
priority: 1
pr: 7425
claim: "2026-09-03T01:39:49Z"
assignee: "receipt-relation-delegation-and-relation-tree"
blocked-by: null
closed-reason: null
---

## Context

Measured 2026-08-30 (`pnpm parity:api:extra --package activerecord
--novel-only`): **48 novel names across 11 files** under `relation/`. Phase 1 of
the RFC because it has the highest expected delete-rate — most of these are
trails-shaped helper layers around a Rails method that already exists.

The population, largest first:

- `relation/delegation.ts` — 15: `associationRelationClassFor`,
  `classMethodDelegator`, `collectionProxyClassFor`, `delegateArrayMethod`,
  `delegateArrayMethodAsync`, `delegateEnumerableMethod`,
  `delegateRecordMethodSync`, `DelegationMethods`,
  `disableJoinsAssociationRelationClassFor`, `guardBaseMethodDelegation`, `has`,
  `hasDelegated`, `includeInto`, `initialize`, `wrapWithScopeProxy`. Rails'
  counterpart is `activerecord/lib/active_record/relation/delegation.rb`, whose
  whole surface is `ClassSpecificRelation`, `ClassMethods#create`/`#relation_class_for`
  and the `delegate` macro calls. Read that file before deciding: several of
  these are one Ruby `delegate` line exploded into named TS helpers, which is
  route 1 (fold back into the ported method), not a receipt.
- `relation/predicate-builder/deferred-distinct-pk-in.ts` — 7, no Ruby
  counterpart file.
- `relation/ruby-inspect.ts` — 6, no counterpart. `rubyInspect` and friends
  implement MRI `Object#inspect` formatting; RFC 0129 moved that class of thing
  into `@blazetrails/ruby-compat`, so check whether this belongs there before
  writing a receipt here.
- `relation/calculations.ts` — 5: `performAverage`, `performCount`,
  `performMaximum`, `performMinimum`, `performSum`. Rails'
  `relation/calculations.rb` has no `perform_*`; it dispatches through
  `#calculate` / `#execute_simple_calculation`. Likely route 1 or route 4.
- `relation/compact-uniq-ids.ts` (3), `relation/query-methods.ts` (3:
  `areStructurallyCompatible`, `argumentError`, `isBlankArgument`),
  `relation/thenable.ts` (3), `relation/predicate-builder/is-base-instance.ts`
  (2), and 3 files at 1 each.

## Acceptance criteria

- All 48 names are resolved by one of the RFC's four routes, and the PR body
  states which route each file took. Deletion is preferred; a `CONVERGEABLE`
  receipt carries a real story id, and a `PERMANENT` one cites the ratified
  CLAUDE.md section it rests on.
- `pnpm parity:api:extra --package activerecord --novel-only` shows the
  `relation/` files at 0 novel.
- activerecord's `novel` mark is tightened **in this PR** with
  `pnpm parity:api:extra:tighten`. The mark is not raised, and there is no
  reseed.
- `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:params` show
  no new rows — folding a helper back into a ported method must not drop a call
  Rails makes.
