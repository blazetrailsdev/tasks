---
title: "Retire the JoinLeaf node kind — Rails' join tree holds only JoinBase and JoinAssociation"
status: done
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6774
claim: "2026-08-20T15:22:34Z"
assignee: "port-activejob-test-helper-for-destroy-association-async"
blocked-by: null
closed-reason: null
---

## Context

PR #6759 deleted `makeConstraints`' `!(child instanceof JoinAssociation)` arm —
the hand-rolled `aliases[table_name] == 0` claim
(`vendor/rails/activerecord/lib/active_record/associations/alias_tracker.rb:60-63`)
that intermediate `JoinLeaf` nodes used to make for themselves. Alias claiming
now happens once, inside the `JoinAssociation#joinConstraints` chain walk, as
Rails does.

That removed `JoinLeaf`'s reason to participate in aliasing but not `JoinLeaf`
itself. `packages/activerecord/src/associations/join-dependency.ts` still
carries the node kind, and `makeConstraints` still redistributes the resolved
tables and joins from the one chain walk back onto a per-link node array:

```ts
const nodes = child.throughGroup ? child.throughGroup.nodes : [child];
for (let idx = 0; idx < chainLen; idx++) { ... node.arelTable = ...; node.effectiveSqlName = ...; }
```

Rails' join tree holds only `JoinBase`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_base.rb`)
and `JoinAssociation`
(`.../join_dependency/join_association.rb`). There is no third node kind: a
`has_many :through` is ONE `JoinAssociation` whose `join_constraints` walks
`reflection.chain` internally, and column projection for the whole chain comes
off that single node. trails' extra `JoinLeaf` per chain link exists so each
link can project its own columns during hydration.

`pnpm parity:api:extra --package activerecord` scores
`associations/join-dependency.ts` at 4 novel names.

## Converged shape

One `JoinAssociation` per tree edge, with the through chain resolved inside it,
matching `join_association.rb`. Column projection and row hydration for the
chain's intermediate links come off that single node — the way Rails' `aliases`
/ `instantiate` pair already does it — rather than off sibling `JoinLeaf`
nodes. With no consumer left, `JoinLeaf` and the `throughGroup` redistribution
loop in `makeConstraints` are deleted.

If a hydration consumer genuinely cannot be served from the single node, block
this story naming that consumer and the `file:line` — do not close it by
documenting `JoinLeaf` as intentional.

## Acceptance criteria

- [ ] `JoinLeaf` no longer exists in `join-dependency.ts`; nothing constructs it.
- [ ] `makeConstraints` no longer redistributes tables/joins onto a per-link
      node array — one `JoinAssociation#joinConstraints` call per edge.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface
      for `associations/join-dependency.ts` (4 novel today; expect a drop).
- [ ] `pnpm parity:api:calls` / `:args` add zero rows.
- [ ] `join-dependency-through-aliasing`, `eager`, `inner-join-association`,
      `left-outer-join-association`, `has-many-through-associations` green on
      SQLite, PostgreSQL and MySQL/MariaDB.
