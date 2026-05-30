---
title: "AF5 — distinguish raise-worthy eager_load errors from capability-gap fallbacks"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In `addAssociation` / `_walkSpec`, eager_load currently degrades silently to
preload for polymorphic / misspelled associations. Rails raises. Distinguish the
two cases.

## Acceptance criteria

- [ ] Raise `EagerLoadPolymorphicError` / `ConfigurationError` for polymorphic
      and misspelled associations instead of silently falling back to preload
- [ ] Keep CPK / unjoinable-through as legitimate capability-gap fallbacks
- [ ] Tests cover both the raise paths and the retained fallbacks

## Notes

From the associations gap plan (AF5), ready now.
