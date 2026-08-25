---
title: "Express the QueryMethods/SpawnMethods private boundary in the mixin files, retiring the hand-transcribed PRIVATE_MIXIN_INSTANCE_METHODS set"
status: done
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6767
claim: "2026-08-20T12:22:28Z"
assignee: "express-mixin-private-boundary-structurally"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `private` keyword splits a module's members into
`public_instance_methods(false)` and the rest. `QueryMethods` has one at
`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1677` and
`SpawnMethods` one at `.../spawn_methods.rb:71`, and Rails reads the public half
by reflection — `CollectionProxy`'s delegate list is exactly
`[QueryMethods, SpawnMethods].flat_map { |k| k.public_instance_methods(false) }`
(`.../associations/collection_proxy.rb:1128-1137`).

trails' mixins are plain object literals — `QueryMethodBangs`
(`packages/activerecord/src/relation/query-methods.ts`) and `SpawnMethods`
(`packages/activerecord/src/relation/spawn-methods.ts`) — and a JS object
literal carries no public/private distinction. PR #6756 derived the delegate
list off `Object.keys()` on both, which required naming the boundary somewhere:
`PRIVATE_MIXIN_INSTANCE_METHODS` in
`packages/activerecord/src/associations/collection-proxy.ts` is a 41-name set
hand-transcribed from the defs after `query_methods.rb:1677` plus
`spawn_methods.rb:71`'s `relation_with`.

That set is the residue of the same hazard the PR removed: a private helper
added to `QueryMethodBangs` and not added to the set is silently delegated to
`scope`, and one renamed goes stale, with no gate to catch either. It also lives
in the wrong file — the boundary is a fact about the mixin module, not about
`CollectionProxy`.

## Converged shape

Make the boundary structural in the mixin files, so `public_instance_methods(false)`
is derived rather than transcribed. The straightforward shape mirrors Ruby's own
layout: declare the members above the `private` line and the members below it as
two objects in the mixin's own file, in Rails source order, and compose the
mixed-in object from both —

```ts
const QueryMethodsPublicInstanceMethods = { ... } as const;   // above :1677
const QueryMethodsPrivateInstanceMethods = { ... } as const;  // `private` (:1677)
export const QueryMethodBangs = {
  ...QueryMethodsPublicInstanceMethods,
  ...QueryMethodsPrivateInstanceMethods,
} as const;
```

`collection-proxy.ts` then reads the public object's keys directly and
`PRIVATE_MIXIN_INSTANCE_METHODS` is deleted. Same for `spawn-methods.ts` and its
one private member, `relationWith` (`spawn_methods.rb:72`).

Keep the delegated set unchanged: it is pinned by
`packages/activerecord/src/associations/collection-proxy-delegate-methods.trails.test.ts`,
which should keep passing with the private set sourced from the mixins instead
of from the hand-written list.

## Acceptance criteria

- [ ] `PRIVATE_MIXIN_INSTANCE_METHODS` no longer exists in `collection-proxy.ts`;
      the public/private split is expressed in `relation/query-methods.ts` and
      `relation/spawn-methods.ts`, at the Rails `private` boundary, with the
      `query_methods.rb:1677` / `spawn_methods.rb:71` cites at the split.
- [ ] The delegated set is unchanged; the existing pin test passes unmodified
      except for where it sources the private names.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
