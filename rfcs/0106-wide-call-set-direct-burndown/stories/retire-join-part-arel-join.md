---
title: "retire-join-part-arel-join"
status: ready
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
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

# Retire `JoinPart#arelJoin` — Rails' JoinAssociation carries no join back-reference

## Context

`retire-join-leaf-node-kind` (PR #6774) removed the `JoinLeaf` node kind and the
per-chain-link redistribution in `JoinDependency#makeConstraints`, converging the
join tree onto Rails' `JoinBase` + `JoinAssociation` pair. One trails-invented
field survived it: `JoinPart#arelJoin`
(`packages/activerecord/src/associations/join-dependency/join-part.ts:30`).

Rails' `JoinAssociation` (`join_association.rb`) has no counterpart — the joins
`join_constraints` builds are returned to `make_constraints`
(`join_dependency.rb:189-211`) and concatenated into the arel, never stored back
on the node. trails stores the node's own constraint join, and `makeConstraints`
now has to recover it by identity:

```ts
child.arelJoin =
  (built as Nodes.Join[]).find((join) => join.left === resolvedRoot!.aliased) ?? null;
```

Nothing in `src/` reads it. Its only consumers are three test files, which use it
as a convenient handle on the emitted join:

- `packages/activerecord/src/associations/join-dependency-quoting.test.ts`
  (12 sites)
- `packages/activerecord/src/associations/join-dependency-through-aliasing.test.ts`
  (4 sites, after #6774)
- `packages/activerecord/src/relation/cpk-eager-pluck-cache-version-composite-fk-collection.trails.test.ts:74`

`pnpm parity:api:extra --package activerecord` scores
`associations/join-dependency/join-part.ts` at 7 novel names; `arelJoin` is one.

## Converged shape

`arelJoin` and the identity-recovery `find` in `makeConstraints` are deleted. The
tests read the joins `joinConstraints` returns instead —
`join-dependency-through-aliasing.test.ts` already has the `joinedTableNames`
helper for exactly that, added in #6774.

## Acceptance criteria

- [ ] `JoinPart#arelJoin` no longer exists; nothing assigns or reads it.
- [ ] `makeConstraints` no longer scans `built` to recover a node's own join.
- [ ] The three test files above assert against the returned join sources.
- [ ] `pnpm parity:api:extra --package activerecord` drops one novel name for
      `associations/join-dependency/join-part.ts`.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows.
