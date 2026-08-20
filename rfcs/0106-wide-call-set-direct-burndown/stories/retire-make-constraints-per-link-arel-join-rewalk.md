---
title: "JoinDependency#makeConstraints re-walks joinConstraints' output to redistribute per-link arelJoin; Rails just concatenates"
status: ready
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency#make_constraints`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:189-211`)
concatenates the flat array `join_constraints` returns and never reconstructs
per-chain-link joins — Rails keeps the whole `reflection.chain` inside the one
`JoinAssociation`, so there is nothing to redistribute.

trails carries a tree node per through link (the target plus its `_through_`
leaves) so each can project its own columns, and `makeConstraints`
(`packages/activerecord/src/associations/join-dependency.ts`) therefore re-walks
the returned array to hand each link its `arelJoin`. After PR #6758 that array
also carries the scope's join sources inline (Rails'
`joins.concat arel.join_sources`, `join_association.rb:64-69`), so the re-walk
has to tell a constraint join from a scope join source. It does that by table
identity:

```ts
if (resolved && (join as { left?: unknown }).left === resolved.aliased) {
```

Identity is sound (the resolver hands `joinConstraints` the exact table object
it puts in `new joinType(table, …)`, and `appendConstraints` carries `left`
through by reference when it rebuilds), and it replaced a table-NAME comparison
that a review flagged as misattribution-prone. But the whole re-walk —
`resolvedByIdx`, `walkedLen`, and the `throughGroup.nodes` redistribution — is
trails-only bookkeeping with no Rails counterpart to cite.

## Converged shape

Retire the per-link redistribution: `makeConstraints` concatenates what
`joinConstraints` returns, as `join_dependency.rb:189-211` does, and whatever
the tree nodes still need for projection is derived where projection actually
happens rather than by mapping joins back onto chain links. This is gated on the
per-link `_through_` tree nodes themselves, which exist for column projection —
retiring `arelJoin`/`tableIndex` bookkeeping without addressing why trails
carries a node per link would just move the invention.

## Acceptance criteria

- `makeConstraints` no longer re-walks `built` to assign `node.arelJoin`.
- `resolvedByIdx` / `walkedLen` are gone, or reduced to what projection needs.
- Alias + scope-join suites green on SQLite, PostgreSQL and MySQL/MariaDB:
  `join-dependency-through-aliasing`, `inner-join-association`,
  `left-outer-join-association`, `has-many-through-associations`, `eager`.
