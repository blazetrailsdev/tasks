---
title: "Delete makeConstraints' non-JoinAssociation leaf table-claim arm (JoinLeaf has no Rails counterpart)"
status: ready
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`makeConstraints` in
`packages/activerecord/src/associations/join-dependency.ts` (post PR #6751) has
a branch Rails does not:

```ts
} else if (!(child instanceof JoinAssociation)) {
  // claims child.tableName / child.effectiveSqlName counts by hand
}
```

It exists because trails models a through-chain's intermediate links as
`JoinLeaf` tree nodes, a node kind Rails has no counterpart for — Rails' tree
holds only `JoinBase` and `JoinAssociation`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb`,
`.../join_base.rb`), and every chain link is resolved by
`JoinAssociation#join_constraints` walking `reflection.chain`, never by a
separate tree node. So the branch hand-rolls the `aliases[table_name] == 0` arm
of `aliased_table_for` (`associations/alias_tracker.rb:60-63`) instead of
calling the method — it cannot call it, because the count bump it needs for an
already-aliased `effectiveSqlName` is not what `aliased_table_for` does.

## Converged shape

- Once the through chain is resolved by one `JoinAssociation#joinConstraints`
  walk (see `converge-make-constraints-onto-join-constraints-block`), the
  intermediate `JoinLeaf` nodes no longer need their own table claim, and the
  branch is deleted outright rather than rewritten.
- If `JoinLeaf` must stay for column projection/hydration, it stops
  participating in alias claiming: the claim happens once, in the chain walk.

## Acceptance criteria

- [ ] The `!(child instanceof JoinAssociation)` arm of `makeConstraints` is
      gone; no alias-count bookkeeping outside `AliasTracker`.
- [ ] `join-dependency-through-aliasing`, `eager`, `inner-join-association`,
      `left-outer-join-association` green on SQLite, PostgreSQL and
      MySQL/MariaDB.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
