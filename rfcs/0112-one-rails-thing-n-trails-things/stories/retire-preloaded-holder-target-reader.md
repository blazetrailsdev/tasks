---
title: "Retire the trails-only _preloadedHolderTarget reader onto Rails' loaded?/stale_target?/load_target"
status: done
updated: 2026-08-29
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7204
claim: "2026-08-29T11:52:35Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

`_preloadedHolderTarget`
(`packages/activerecord/src/associations.ts:607`) is a trails-only free
function with no Rails counterpart. It reads the holder out of
`record._associationInstances`, applies Rails' `loaded?` /
`@stale_state && stale_target?` pair by hand, and returns a one-key box
(`{ value }`) so a loaded-nil target is distinguishable from a miss.

It is the last standing piece of the RFC 0022 `_preloadedAssociations`
shadow-`Map` machinery. The sibling story
`remove-preloaded-associations-shadow-map` (PR #4039) removed the `Map`;
`retire-explicit-target-and-loaded-from-preload-fields` (PR #7090) removed the
`_explicitTarget` / `_loadedFromPreload` provenance flags it gated on and
rewrote its body onto Rails' own state — but the function itself, and the box
return, are still surface Rails does not have.

Rails has no such reader. A caller that wants the target asks the association:

- `association.rb:189-193` — `load_target` re-queries on
  `(@stale_state && stale_target?) || find_target?`, then `loaded!`, then
  returns `target`. That is exactly the condition
  `_preloadedHolderTarget` open-codes.
- `association.rb:81-83` (`loaded?`), `:97-99` (`stale_target?`).
- `collection_proxy.rb` / `singular_association.rb#reader` are the public
  entry points; neither hands back a box, because Ruby's `nil` target and
  "no association" are already distinct there (`association(name)` raises
  `AssociationNotFoundError` rather than returning a miss).

The four callers:

- `packages/activerecord/src/validations.ts:226`
- `packages/activerecord/src/associations/has-many-association.ts:586`
- `packages/activerecord/src/associations/association.ts:694`
- `packages/activerecord/src/associations/instance-methods.ts:67`

## Converged shape

Each caller reaches the holder directly — `record.association(name)` — and
consults `loadTarget()` (or `isLoaded()` / `isStaleTarget()` where the caller
genuinely must not trigger a query, which is the case the box return exists to
serve). The `{ value }` box goes away with the function: a caller that needs to
distinguish "loaded, target is null" from "not loaded" has both predicates in
front of it once it holds the association object, which is how Rails' callers
do it.

Note the boxing is load-bearing today and must not be dropped without moving
each caller onto the two predicates first — `{ value: null }` and `null` mean
different things at every one of the four sites.

## Acceptance criteria

- [ ] `_preloadedHolderTarget` is deleted from `associations.ts`.
- [ ] All four callers read the holder through `record.association(name)` and
      Rails' own `loaded?` / `stale_target?` / `load_target`, preserving the
      loaded-nil vs. miss distinction at each site.
- [ ] `pnpm parity:api:extra --package activerecord` novel/total both drop.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green, no new rows.
- [ ] The inverse-of, preload, eager-load, strict-loading, autosave,
      nested-attributes and validations suites stay green on SQLite,
      PostgreSQL and MySQL/MariaDB.
