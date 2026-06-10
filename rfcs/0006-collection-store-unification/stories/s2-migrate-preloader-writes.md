---
rfc: "0006-collection-store-unification"
title: "Migrate preloader writes through the proxy"
status: done
updated: 2026-06-10
cluster: associations
deps: ["s1-proxy-backed-read-api"]
est-loc: 160
priority: 1
pr: 3095
claim: "2026-06-10T19:09:39Z"
assignee: "s2-migrate-preloader-writes"
blocked-by: null
---

# S2 — Migrate preloader writes through the proxy

## Goal

Route the inverse-of preloader write path
(`preloader/association.ts:266-269`) and the `set_inverse_instance` callers
through the proxy's write API instead of writing to `_cachedAssociations`
directly. After this story, has_many target data is written in exactly one
place.

## Acceptance

- Preloader populates the proxy target, not `_cachedAssociations`.
- `_wireInverseAssociation` no longer needs to seed
  `proxy._replacedOrAddedTargets` from the cache — the C2 (#2591) seam is
  removed or reduced to a no-op.
- All currently-passing inverse-association tests still pass; no test renames.
- `api:compare` delta non-negative.

## Notes

Cross-check against Rails `add_to_target` in `collection_association.rb` —
preloaded records and inverse-wired records both land in `@target` there.
