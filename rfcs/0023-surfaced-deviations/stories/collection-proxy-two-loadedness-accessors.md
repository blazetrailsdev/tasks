---
title: "CollectionProxy carries two loadedness accessors (inherited isLoaded vs loaded)"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `find_from_target?` onto one body (PR #5188).

`CollectionProxy extends Relation`, so it inherits `Relation#isLoaded`
(`packages/activerecord/src/relation.ts:2073`), a getter over Relation's
`_loaded`. But the proxy deliberately keeps association loadedness in its own
`_target` / `_targetLoaded` and exposes it as a _different_ member,
`get loaded()` (`associations/collection-proxy.ts:216`). Two same-meaning names
on one object, tracking two different flags:

- `proxy.isLoaded` → Relation's `_loaded`
- `proxy.loaded` → `_targetLoaded`

This is an active footgun. It is why the shared `find_from_target?` body in
PR #5188 takes `loaded` as an explicit parameter rather than reading it off
the host. `this.isLoaded` resolves to a _boolean getter_ on the proxy and a
_method_ on `CollectionAssociation`, so any single accessor name silently reads
the wrong flag (or throws "is not a function") on one of the two hosts. An
earlier iteration of that PR hit exactly this — caught by tsc, but only because
the host interface happened to be typed.

Rails has one `loaded?` per object; `CollectionProxy#loaded?` is
`@association.loaded?` (`collection_proxy.rb`), never a second flag.

## Acceptance criteria

- [ ] `CollectionProxy` has one loadedness accessor, not two — either the
      inherited `Relation#isLoaded` is overridden to return `_targetLoaded`
      (if Relation's `_loaded` is genuinely unused on the proxy), or the
      divergence is made unreachable/explicit rather than silently shadowed.
- [ ] Confirm first whether anything reads `Relation#_loaded` on a
      `CollectionProxy` — the override is only safe if not.
- [ ] The `find_from_target?` seam can then drop its explicit `loaded`
      parameter (`collection-association.ts:757`,
      `collection-proxy.ts:3857`), restoring Rails' zero-arg arity.
- [ ] No regression in collection-proxy / relation / thenable / delete-all
      suites.
