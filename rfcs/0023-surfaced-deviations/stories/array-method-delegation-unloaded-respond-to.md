---
title: "Converge curated Array-method delegation respond-to/load on unloaded relations"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3669
claim: "2026-06-19T19:35:02Z"
assignee: "array-method-delegation-unloaded-respond-to"
blocked-by: null
---

## Context

PR #3659 (collection-proxy-relation-enumerable-partition) converged
`Enumerable#partition` by making the delegated method **async + self-loading**:
it is present on an unloaded relation/proxy and forces the load itself
(`toArray()` for relations, `CollectionProxy#load()` for associations,
mirroring Rails' `records` → `load_target`).

The synchronous **curated Array-method** delegation
(`delegateArrayMethod`, `relation/delegation.ts`) was NOT converged and remains
a Rails deviation: `sort`/`map`/`join`/`reverse`/`slice`/… resolve to
`undefined` on an _unloaded_ relation/proxy (gated on `_loaded`), so
`Comment.all().sort` is `undefined` until awaited/loaded. In Rails these are
`delegate ... to: :records` plus the `include Enumerable` mixin, so
`assert_respond_to target, :sort` passes on an unloaded relation and the call
forces a load via `records` (delegation.rb, relation.rb).

The blocker: these methods have synchronous return contracts (`sort` returns an
Array, not a Promise), and JS has no blocking IO, so the partition trick
(return a Promise) changes their signature. Converging requires a decision:
either (a) accept the deviation and document it, or (b) make the whole array
surface async (large semantic change). The ported sweep
`test_delegates_<method>_to_Array` (delegation_test.rb) currently only exercises
`partition`; the rest of ARRAY_DELEGATES is unported pending this decision.

- trails: `packages/activerecord/src/relation/delegation.ts`
  (`delegateArrayMethod`, gated on `_loaded`); `associations.ts`
  (`wrapCollectionProxy`, gated on `scopeVal === undefined` + loaded `target`).
- Rails: `activerecord/lib/active_record/relation/delegation.rb`,
  `relation.rb` (`include Enumerable`, `records` → `load`).

## Acceptance criteria

- [ ] Decide converge-or-document for the sync Array-method delegation surface
      on unloaded relations/proxies (default: converge to Rails respond-to +
      load-on-call semantics where feasible without breaking sync contracts).
- [ ] If converging: array methods respond on unloaded targets and load the
      DB rows (proxy path hydrates the collection cache like partition does).
- [ ] Port the remaining `test_delegates_<method>_to_Array` sweep entries from
      delegation_test.rb that this unblocks; test names match Rails verbatim.
- [ ] api:compare and test:compare delta non-negative.
