---
title: "Share one in-memory target between the collection association object and its CollectionProxy"
status: ready
updated: 2026-07-24
rfc: "0005-activerecord-gaps"
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

# Share one in-memory target between the collection association object and its CollectionProxy

## Context

Prerequisite for `route-through-collection-writes-onto-association-insert-record`
(RFC 0005-activerecord-gaps). That story wants the user-facing
`CollectionProxy` through-writes (`push`/`<<`/`append`/`appendBang`/`create`/
`createBang`) to reach `HasManyThroughAssociation#insertRecord` via
`concatRecords`, deleting the ~200-line trails-invented `_pushThrough`
(`packages/activerecord/src/associations/collection-proxy.ts:2255`). That reroute
is blocked on a structural gap this story removes.

### The gap

trails keeps the collection's in-memory target in **two** places that do not
share state:

- The user-facing `CollectionProxy`, cached in `record._collectionProxies`
  (returned by `association()`, `associations.ts:3215`), holds `_target: T[]`
  (`collection-proxy.ts:177`). RFC 0022 designates this the **canonical**
  has_many store — readers (`size()`/`load()`), autosave (`_loadedAssociation`
  prefers `proxy.target`), and the through build/delete paths all consult it
  (see `throughProxy` → `collectionProxyFor`, `has-many-through-association.ts:843`).
- The OO `HasManyThroughAssociation` / `HasManyAssociation`, cached in
  `record._associationInstances`, holds its own `this.target` (base
  `Association`, `association.ts:223` etc.). RFC 0022 calls this the **stale
  secondary copy**.

`CollectionAssociation#insertRecord` (`collection-association.ts:359-370`) →
`addToTarget` (`682`) → `replaceOnTarget`/`replaceOnTargetAsync` (`1319`/`1337`)
mutate `assoc.target` — the stale mirror — via `finishReplaceOnTarget`
(`1302`). So routing a proxy write through the OO `concat`/`insertRecord` today
would land the record in the OO mirror, invisible to the canonical proxy
`_target` that every reader consults.

Only two OO paths already bridge to the canonical proxy, and both are narrow:
`inversedFrom` under `has_many_inversing` (`collection-association.ts:787-797`,
via `associationProxy(...)._wireInverseTarget`) and `throughProxy` (which
resolves the proxy for the _join/through_ model, not for the HMT target).

### Scope of this story

Make the OO collection association object and its `CollectionProxy` operate on a
**single** in-memory target, so that `addToTarget` / `replaceOnTarget` /
`loadedBang` / `reset` / `loadTarget` and the proxy's `_target` /
`_targetLoaded` stay coherent. Concretely, pick ONE of:

1. Back the OO association's `target`/`loaded` getters+setters by the canonical
   `CollectionProxy` (delegate `this.target` → `associationProxy(owner, name)._target`),
   so `replaceOnTarget` writes flow to the proxy; or
2. Back the proxy's `_target`/`_targetLoaded` by the OO instance.

Rails has a single `@target` on the association and the proxy delegates to it
(`CollectionProxy` forwards to `@association`); option (1) is closest to Rails
and to RFC 0022's "proxy is canonical" — the OO object should read/write the
proxy's array rather than owning a parallel one.

Do NOT reroute `_pushThrough` in this story — that is the dependent story. This
story only unifies the target so the reroute becomes a local edit.

## Acceptance criteria

- [ ] The OO collection association (`HasManyAssociation` / `HasManyThroughAssociation`)
      and the `CollectionProxy` returned by `association()` share ONE in-memory
      target array + loaded flag; a write via either surface is visible through
      the other with no manual sync step.
- [ ] `replaceOnTarget` / `addToTarget` (OO `concat`/`insertRecord` path) land
      records in the canonical proxy `_target`.
- [ ] Loaded-ness (`_targetLoaded` / `loaded`), `_addToTarget` dedup, and
      before/after_add callbacks remain single-fire (no double-append, no
      double-callback) across the shared target.
- [ ] No regression in has_many / has_many_through / HABTM / nested-through /
      autosave / preload-hydration suites (the `_hydrateFromPreload` and
      `_loadedViaAsync` bridges in `association()` still work).

## Notes / risks

- `association()` already hydrates the proxy from a `_loadedViaAsync` OO
  instance (`associations.ts:3229-3234`); a shared target must not double-hydrate.
- Singular (`hasOne`/`belongsTo`) holders are out of scope — this is the
  collection target only.
- Watch the load-order constraint: `collection-association.ts` already
  value-imports `association as associationProxy` from `associations.js`
  (`collection-association.ts:3`), so the delegation hook exists.
