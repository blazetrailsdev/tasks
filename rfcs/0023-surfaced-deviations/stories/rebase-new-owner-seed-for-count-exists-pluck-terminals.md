---
title: "Rebase new-owner CollectionProxy seed for count/exists/pluck/find terminals, not just finders"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4465 (collection-proxy-mutated-finder-scope-stale-new-owner-seed),
which rebased a stale new-owner `1=0` seed onto the live `association.scope`
for the FINDER path (`first`/`last`/`take`/`find_nth`) and `toArray`. The rebase
is triggered by two hooks: `AssociationRelation#toArray` and the
`_maybeRebaseAssociationSeed?.()` call injected into `performFirst`/`performLast`
ahead of their `_isNone` short-circuit
(`packages/activerecord/src/relation/finder-methods.ts`).

The other query terminals each have their OWN `_isNone` short-circuit that is
NOT preceded by a rebase hook, so a relation spawned off a new-owner seed
(`owner.things.where(...)`) still returns stale-empty after the owner is saved:

```ts
const author = new Author({ name: "Gap" });
const rel = association(author, "posts").where({ title: "GG" }); // 1=0 seed
await author.save();
await Post.create({ title: "GG", author_id: author.id });
await rel.count(); // 0    (should be 1)
await rel.exists(); // false (should be true)
await rel.pluck("title"); // []    (should be ["GG"])
```

Verified against PR #4465's merged HEAD. `count`/`exists`/`pluck`/`find` on the
CollectionProxy ITSELF are fine (they route through `scope()`); the gap is only
on SPAWNED AssociationRelations that copied the stale seed.

Rails-faithful target: Rails' CollectionProxy delegates EVERY query to the live
`association.scope`, so all terminals resolve the persisted FK — not just the
bounded finders.

## Acceptance criteria

- [ ] A relation spawned off a new-owner seed resolves the persisted FK on
      `count`, `exists`, `pluck`, `pick`, and `find` after `save` (not just
      `first`/`last`/`take`/`find_nth`/`toArray`).
- [ ] Prefer generalizing the rebase to a single chokepoint that runs before
      the shared `_isNone` short-circuits, rather than sprinkling
      `_maybeRebaseAssociationSeed?.()` into every terminal (altitude: the
      per-terminal hook in finder-methods.ts is the pattern to consolidate).
- [ ] Regression tests covering count/exists/pluck on a spawned new-owner-seed
      relation, mirroring the has_many + HABTM finder tests already added in
      PR #4465.
