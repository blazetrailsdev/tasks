---
title: "Writes through the association() wrapper never reach the canonical CollectionProxy target"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced while converging `find_from_target?` onto one body (PR #5188).

Writes made through the `HasManyAssociation` wrapper returned by
`owner.association(name)` do not reach the canonical `CollectionProxy` store.
Verified on `Author#posts`:

```text
assoc = author.association("posts")
await assoc.concat([post])
assoc.target.length            // 1
author.posts.target.length     // 0   ← canonical store never saw it
author.posts._targetLoaded     // false
```

The proxy is the canonical has*many store (RFC 0006; `Base#_associationCache`
surfaces it and `base.ts:3050-3067` documents the wrapper as "a stale secondary
copy"). Reads were unified by RFC 0006 s1-s3, but the wrapper's own
`target` array is still a second mutable store on the write side, and
`buildAssociationInstance` (`associations/instance-methods.ts:26`) hands out a
fresh instance whose target is only ever \_pulled* from the cache by
`syncAssociationInstance`, never pushed back.

Rails has exactly one `@target`, on the association; `CollectionProxy`
delegates every mutation to it (`collection_proxy.rb`), so the split cannot
arise there.

## Acceptance criteria

- [ ] A mutation through `owner.association(name)` (`concat`, `delete`,
      `replace`, `<<`) is visible in `owner.<name>.target` and vice versa —
      one store, either direction.
- [ ] Determine whether `CollectionAssociation#target` should become a view
      onto the proxy's `_target` (preferred, matches RFC 0006's read
      unification) or whether the wrapper should stop carrying a target at all.
- [ ] Update the "stale secondary copy" note in `base.ts:3050-3067` to match.
- [ ] Regression coverage for the round trip in both directions.
- [ ] No regression in collection-proxy / has_many / has_many_through /
      autosave / nested-attributes suites.
