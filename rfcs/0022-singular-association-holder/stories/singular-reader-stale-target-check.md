---
title: "singular-reader-stale-target-check"
status: ready
updated: 2026-06-19
rfc: "0022-singular-association-holder"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`SingularAssociation#reader` (`singular-association.ts:74`) returns early when
`this.loaded` is true, skipping the `stale_target?` check that Rails performs:

```ruby
# singular_association.rb:10–13
if !loaded? || stale_target?
  reload
end
```

`isStaleTarget()` exists in `association.ts` and `loadTarget()` checks it, but
the early return at `if (this.loaded) return this.target` prevents it from being
reached for already-loaded associations. A loaded belongs_to/has_one that becomes
stale (FK changes after load) will return the stale cached target instead of
reloading.

Surfaced as a pre-existing deviation during PR #3611
(`hm-belongsto-inverse-cache-poisoned-after-collection-load`).

## Acceptance criteria

- [ ] `SingularAssociation#reader` checks `isStaleTarget()` when `this.loaded`,
      and calls `loadTarget()` (returning a Promise, consistent with the
      lazy-load path introduced in PR #3611) when the target is stale.
- [ ] Existing strict-loading tests pass.
- [ ] `test:compare` delta is non-negative.
