---
title: "Expose Relation#slice and #name delegations under Rails names"
status: in-progress
updated: 2026-07-05
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: 4615
claim: "2026-07-05T14:52:29Z"
assignee: "relation-delegation-expose-slice-and-name"
blocked-by: null
---

## Context

Story `relation-delegation-rails-named-methods` (PR #4292) exposed the
`ActiveRecord::Delegation` `to: :records` / `to: :model` set (delegation.rb:101-106)
as real named methods on `Relation` via `DelegationMethods`
(`packages/activerecord/src/relation/delegation.ts`), but deferred two names,
which remain per-name scoped skips in `scripts/api-compare/conventions.ts`
(`SCOPED_SKIP_GROUPS`, names `["slice", "name"]`, rubyFile `relation.rb`):

- **`slice`** — `CollectionProxy` already defines a synchronous, array-backed
  `slice(start, end): T[]` over its eager `_target`
  (`packages/activerecord/src/associations/collection-proxy.ts`). A `to: :records`
  async `slice` on the `Relation` base would be an incompatible override of that
  tested surface (TS override-assignability error), so it was not exposed.
- **`name`** — adding a `name: string` getter to the structurally-typed
  `Relation` collides with the ubiquitous `{ name }` object shape, silently
  flipping `Array#reduce` accumulator inference (e.g.
  `[...].reduce((r, p) => r.where(p), Model.unscoped())` from `Relation` to
  `{ name }`), which broke `relations.test.ts`.

Both are reachable at runtime through the delegation Proxy; only the real-method
surface (and thus the relation.rb api:compare credit) is missing.

## Acceptance criteria

- Expose `slice` and `name` under their Rails names on `Relation` without
  regressing `CollectionProxy#slice`'s synchronous contract or `Array#reduce`
  accumulator inference (e.g. a narrower/overload-compatible `slice` signature
  and a typing strategy for `name` that doesn't widen the structural surface).
- Remove the `["slice", "name"]` entry from `SCOPED_SKIP_GROUPS`; relation.rb
  stays at 100% api:compare; no test:compare regression.
- Test names match Rails verbatim.
