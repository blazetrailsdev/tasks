---
title: "One to: :records list, one loader — the Rails-name half reads toArray() while the JS-name half reads loadTarget()"
status: in-progress
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6773
claim: "2026-08-20T14:52:33Z"
assignee: "unify-record-delegate-loader-across-rails-and-js-spellings"
blocked-by: null
closed-reason: null
---

## Context

Found while landing PR #6770 (`retire-collection-proxy-keys-and-entries` /
`express-mixin-protected-boundary-structurally`).

Rails resolves the ENTIRE `delegate ... to: :records` list
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:98-103`)
through ONE method. On a proxy that is `CollectionProxy#records`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1024-1026`),
which is `load_target`
(`.../collection_association.rb:270-278`). One list, one loader, one caching
rule: `load_target` always ends in `loaded!`.

trails splits the same list across two loaders with DIFFERENT caching
semantics, depending only on whether the delegate is spelled with its Rails
name or its JS name:

- **Rails-name half** (`each`, `index`, `toSentence`, `sample`, `rotate`,
  `inGroups`, `asJson`, `toFs`, …) resolves to the inherited async methods on
  `DelegationMethods` (`packages/activerecord/src/relation/delegation.ts`),
  each of which reads `await this.toArray()`.
- **JS-name half** (`map`, `filter`, `sort`, `slice`, `at`, `partition`,
  `flatMap`, the set operators, …) resolves through
  `delegateEnumerableMethod(prop, () => target.loadTarget())` in
  `wrapCollectionProxy`'s `get` trap
  (`packages/activerecord/src/associations.ts`).

`CollectionProxy#toArray` and `CollectionProxy#loadTarget` are not the same
body (`packages/activerecord/src/associations/collection-proxy.ts`):
`loadTarget()` is `return this.load()`, while `toArray()` carries an extra
non-caching arm for a null scope —

```ts
async toArray(): Promise<T[]> {
  if (!this._targetLoaded && this.isNullScope()) {
    const results = await this._execLoad();
    return this._collectionAssociation().mergeTargetLists(results, this._target) as T[];
  }
  return this.load();
}
```

So on a new-record owner (null scope), `owner.things.map(...)` marks the
association loaded and `owner.things.each(...)` does not — two members of one
Rails delegate list disagreeing about whether reading them is a `loaded!`.
Rails has no such split: `load_target` calls `loaded!` unconditionally
(`collection_association.rb:276`).

The record contents are correct on both halves today — both merge, verified
empirically across the whole delegate surface while landing #6770 — so this is
a caching/`loaded?` divergence, not a wrong-records one.

## Converged shape

Every `to: :records` delegate on a proxy reads through the SAME seam, the port
of `records` → `load_target`, so `loaded?` after reading any of them is what
Rails' unconditional `loaded!` (`collection_association.rb:276`) makes it,
regardless of which name the caller used.

Note the ordering dependency: this converges naturally once
`collapse-collection-proxy-toarray-onto-load` (blocked) lands, because the two
loaders differ ONLY by that story's null-scope arm. If that story stays blocked,
this one can still converge by pointing `DelegationMethods`' `this.toArray()`
reads and the `wrapCollectionProxy` traps at one method — but pick the seam
deliberately rather than letting the spelling of the delegate decide.

## Acceptance criteria

- [ ] A Rails-name delegate and a JS-name delegate on the same unloaded proxy
      leave it in the same `loaded?` state (regression test that FAILS on
      baseline — use a null-scope / new-record owner, where the two arms differ).
- [ ] The `to: :records` surface resolves through a single loader; no call site
      picks `toArray()` vs `loadTarget()` based on the delegate's spelling.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows.
- [ ] `associations/` suite green on SQLite, PostgreSQL and MySQL/MariaDB.
