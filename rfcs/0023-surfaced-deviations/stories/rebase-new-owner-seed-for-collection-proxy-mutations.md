---
title: "rebase-new-owner-seed-for-collection-proxy-mutations"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

## Context

Surfaced in review of PR #4862 (rebase-new-owner-seed-for-mutation-terminals),
which routed the `Relation` mutation terminals through the `_isEmptyRelation()`
chokepoint so a relation SPAWNED off a stale new-owner `1=0` seed
(`owner.things.where(...)`) resolves the persisted FK once the owner is saved.

That fix covers `AssociationRelation`, which overrides `_isEmptyRelation()`
(association-relation.ts:69) to rebase the seed. It does NOT cover the
`CollectionProxy` itself:

- `CollectionProxy extends Relation` (collection-proxy.ts:171), NOT
  `AssociationRelation`, and does not override `_isEmptyRelation`. The only two
  definitions are relation.ts:6280 (base, raw `_isNone`) and
  association-relation.ts:69 (rebasing override).
- The proxy defines no `updateAll`/`touchAll`/`updateCounters`, so those resolve
  to `Relation`'s with `this` = the proxy → base chokepoint → raw `_isNone`.
- The `wrapCollectionProxy` `get` trap (associations.ts:3232-3243) does not
  redirect them: `Reflect.get` returns the prototype method, so the `scope()`
  fallback is unreachable.

Confirmed empirically on the PR #4862 tree — mutation terminals invoked on the
PROXY itself, after the owner is saved:

```ts
const author = new Author({ name: "Gap" });
const posts = author.posts; // proxy, seed collapsed to 1=0
await author.save();
await Post.create({ title: "GG", author_id: author.id });
await posts.updateAll({ body: "H" }); // 0  ← should be 1
await posts.updateCounters({ tags_count: 1 }); // 0  ← should be 1
await posts.deleteAll(); // 1  ← already works
```

`deleteAll` works only via its non-diverged branch
(`this.scope().deleteAll()`, collection-proxy.ts:3999), which yields an
`AssociationRelation` and thus the override. Its `diverged` branch
(collection-proxy.ts:3997) calls `super.deleteAll()` with `this` = proxy and has
the same hole — and that branch is exactly the stale-seed case
(`_seededNoneNewOwner` + `whereBang`).

The proxy already solves this for READS via `_finderScope()`
(collection-proxy.ts:726-746), which rebases onto `scope()`. There is no mutation
equivalent — that read/write asymmetry is the gap. Rails has no such split:
`CollectionProxy` delegates every query, `update_all`/`delete_all` included, to
the live `association.scope` (vendor/rails/activerecord/lib/active_record/
associations/collection_proxy.rb).

## Acceptance criteria

- [ ] `owner.things.updateAll(...)` / `.touchAll()` / `.updateCounters(...)`
      invoked on the PROXY itself resolve the persisted FK after the owner is
      saved, mirroring the spawned-relation behavior from PR #4862.
- [ ] `CollectionProxy#deleteAll`'s diverged branch (super.deleteAll()) also
      rebases, not just the `this.scope().deleteAll()` branch.
- [ ] Prefer a single mechanism over per-terminal hooks — e.g. a
      `CollectionProxy#_isEmptyRelation()` override reusing the `_finderScope()`
      rebase, mirroring how reads already work.
- [ ] Regression tests for the proxy-invoked mutation terminals (has_many),
      alongside the spawned-relation tests in collection-proxy.test.ts.
- [ ] Drop the "Note the scope of that override" caveat in the
      `Relation#_isEmptyRelation` doc comment (relation.ts) once closed.
