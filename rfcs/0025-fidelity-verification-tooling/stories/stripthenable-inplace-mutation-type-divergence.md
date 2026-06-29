---
title: "stripthenable-inplace-mutation-type-divergence"
status: ready
updated: 2026-06-29
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`stripThenable(obj)` (`packages/activerecord/src/relation/thenable.ts:20`)
deletes `.then` from a relation/proxy **instance in place** via
`Object.defineProperty(obj, "then", { value: undefined })`, and is typed to
return `Omit<T, "then">` (the `LoadedRelation<R>` alias,
`relation.ts:145`).

It is run by, and returns the stripped `this`, in:

- `Relation#load` — `relation.ts:2632` (`return stripThenable(this)`)
- `Relation#reload` — `relation.ts:2342`
- `Relation#presence` — `relation.ts:2543`
- `CollectionProxy` equivalents — `collection-proxy.ts:1774, 1861, 3269`
- `Relation#inBatches` — yields `stripThenable(batchRel)`
  (`relation.ts:4856, 4909`)

`Relation#records` → `Relation#load`, so anything that materializes a relation
(including `destroyAll`/`deleteAll` via `records()`) strips the instance.

**The footgun:** because the strip mutates the instance in place but only the
_return value_ is retyped to `LoadedRelation`, the **original binding keeps its
`Relation` (thenable) type while its runtime `.then` is gone.** So:

```ts
const davids = Author.where({ name: "David" }); // type: Relation (thenable)
await davids.destroyAll(); // strips davids.then in place
const rows = await davids; // ⚠️ resolves to the Relation
//    OBJECT, not [] — no type error
```

This is silent: `await davids` sees `then === undefined`, treats `davids` as a
non-thenable, and resolves to the relation object. The static type still claims
`await davids` yields `Author[]`. This surfaced concretely while flipping
`prefer-await-relation` to `error` (PR #4281): the autofix rewrote
`await davids.toArray()` → `await davids` and `relation/delete-all.test.ts`'s
`destroy all` test then asserted a `Relation {...}` deep-equals `[]`. PR #4281
worked around it by narrowing the lint rule to **call-expression receivers
only** (a fresh `where(...)`/`all(...)` relation can't have been stripped yet),
because the divergence is undetectable from the type.

## Problem to decide / fix

The in-place `stripThenable` mutation makes a relation binding's static type
(`Relation`, thenable, `await` → array) diverge from its runtime shape (`.then`
deleted, `await` → the object). Options to evaluate:

- Make `load`/`reload`/`presence`/`inBatches` return a _distinct stripped
  wrapper_ (or a shallow clone) instead of mutating and returning `this`, so the
  original thenable binding stays awaitable — closing the divergence at the
  source.
- Or, if in-place stripping must stay for identity reasons, narrow the
  _original_ binding's type after these calls (not feasible in TS without
  reassignment) — i.e. document that the original binding is unsafe to `await`
  and lean on the lint rule.
- Audit for any existing latent bugs where a stripped binding is later
  `await`ed / spread / iterated and silently yields the object.

Check Rails parity: AR relations memoize `@records` and `loaded?`; they do not
have a "then" to strip — JS `await` interop is trails-specific, so the fix
should preserve Rails' "same object, now loaded" identity semantics while
keeping `await` correct.

## Acceptance criteria

- A decision (with rationale) on whether `stripThenable` should stop mutating
  in place, recorded in the RFC/story.
- If fixed: `await rel` on a binding that was `load`/`reload`/`presence`/
  `records`/`destroyAll`'d still resolves to the loaded array (add a regression
  test mirroring the `delete-all.test.ts` `destroy all` scenario without
  `.toArray()`).
- If deferred: document the binding-is-unsafe-after-load invariant next to
  `stripThenable` and confirm `prefer-await-relation`'s call-expression-only gate
  remains the guard.
- No new bespoke schemas; canonical-only test fixtures.
  </content>
