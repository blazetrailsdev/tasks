---
title: "association() wrapper reports loaded? for a seeded-but-unloaded collection proxy"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `find_from_target?` onto one body (PR #5188).

`Base#_associationCache` (`packages/activerecord/src/base.ts:3068-3092`) returns
a `CollectionProxy` when `proxy.loaded === true` **or** when
`Array.isArray(proxy.target) && proxy.target.length > 0`. `association()`
(`associations/instance-methods.ts:122`) then feeds that through
`syncAssociationInstance` → `Association#_setTargetFromLoader`
(`associations/association.ts:222`), which calls `loadedBang()`.

Net effect: a proxy that is merely _seeded_ — records in `_target` but
`_targetLoaded === false`, e.g. after `owner.things.concat(record)` — surfaces
through `owner.association(name)` as a wrapper whose `isLoaded()` is `true`.

Verified empirically on `Author#posts`:

```text
proxy.concat(post) → proxy._targetLoaded=false, proxy.target.length=1
owner.association("posts").isLoaded() === true      // diverges
```

Rails has one loaded flag per association (`@loaded`, set only by
`loaded!` from `load_target`); seeding via `add_to_target` does NOT mark it
loaded (`collection_association.rb`). The trails `_associationCache` heuristic
manufactures loadedness from target non-emptiness.

Concrete consequence: `find_from_target?` cannot be routed through
`owner.association(name)` — it would return `true` (read the in-memory target)
where Rails returns `false` (query the DB). #5188 works around this by binding
`CollectionAssociation#isFindFromTarget`'s body to the proxy and passing
`_targetLoaded` explicitly (`associations/collection-proxy.ts:3857`); the
workaround is documented at the call site. Any other predicate that reads
`isLoaded()` off an `association()` wrapper has the same latent bug.

## Acceptance criteria

- [ ] `owner.association(name).isLoaded()` agrees with the proxy's
      `_targetLoaded` for a seeded-but-unloaded collection proxy — the
      `target.length > 0` arm of `_associationCache` no longer implies loaded,
      or the sync path stops calling `loadedBang()` for that arm.
- [ ] The comment block in `_associationCache` explaining the seeded-proxy arm
      is updated or removed to match the new behavior.
- [ ] Audit the other `isLoaded?.()` readers of `association()` wrappers
      (`autosave-association.ts:72,98,102`, `associations.ts:1587`,
      `base.ts:3852`, `persistence.ts:1816`) for reliance on the old semantics.
- [ ] `CollectionProxy#isFindFromTarget` can drop its explicit `_targetLoaded`
      argument, or the call-site note is updated to say why it still needs it.
- [ ] No regression in collection-proxy / has_many / has_many_through /
      autosave / preloader suites.
