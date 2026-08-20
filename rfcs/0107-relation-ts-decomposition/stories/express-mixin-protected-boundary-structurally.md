---
title: "Express the QueryMethods protected boundary too, dropping the five protected names from CollectionProxy's delegate list"
status: in-progress
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6770
claim: "2026-08-20T13:22:33Z"
assignee: "proxy-record-delegates-read-through-merging-load-target"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy`'s delegate list is
`[QueryMethods, SpawnMethods].flat_map { |k| k.public_instance_methods(false) }`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`).

Ruby excludes `protected` members from `public_instance_methods(false)` just as
it excludes `private` ones. `QueryMethods` has two `protected` sections —
`query_methods.rb:1604` (`build_subquery`, `build_where_clause` plus its
`build_having_clause` alias at `:1654`, `async!`) and `query_methods.rb:1663`
(`arel_columns`) — so Rails delegates **none** of those five names to `scope`.

PR #6767 made the `private` boundary structural in the mixin files
(`packages/activerecord/src/relation/query-methods.ts`), but deliberately kept
the delegated set byte-identical, so
`QueryMethodsPublicInstanceMethods` still carries `buildSubquery`,
`buildWhereClause`, `buildHavingClause`, `asyncBang` and `arelColumns` — five
names Rails does not delegate. That is pre-existing divergence carried forward,
not introduced by #6767.

## Converged shape

Add a `QueryMethodsProtectedInstanceMethods` object between the public and
private ones, holding those five names in Rails source order at the
`query_methods.rb:1604` / `:1663` boundaries, composed into `QueryMethodBangs`
alongside the other two. `MIXIN_PUBLIC_INSTANCE_METHODS` in
`packages/activerecord/src/associations/collection-proxy.ts` continues to read
only the public objects' keys, so the five drop out of the delegate list.

`CollectionProxy extends Relation`, so the implementations stay reachable
through the prototype chain; only the delegate-to-`scope` forwarding goes away,
which is what Rails does.

## Acceptance criteria

- [ ] `buildSubquery`, `buildWhereClause`, `buildHavingClause`, `asyncBang`,
      `arelColumns` are no longer own properties of `CollectionProxy.prototype`.
- [ ] The split is expressed in `relation/query-methods.ts` with the
      `query_methods.rb:1604` / `query_methods.rb:1663` cites.
- [ ] `packages/activerecord/src/associations/collection-proxy-delegate-methods.trails.test.ts`
      still passes.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows; `parity:api` / `parity:test`
      deltas non-negative.
