---
title: "Retire CollectionProxy#_ownSeat — the last non-association target seat"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6685
claim: "2026-08-18T02:03:08Z"
assignee: "port-duration-sum-so-since-and-ago-call-it"
blocked-by: null
closed-reason: null
---

# Retire `CollectionProxy#_ownSeat` — the last non-association target seat

## Context

PR #6683 gave `CollectionAssociation` and `CollectionProxy` one `@target` seat:
the proxy's `_target` / `_targetLoaded` / `_replacedOrAddedTargets` are accessor
pairs onto the association object's `_targetStore` / `_loadedStore` /
`_replacedOrAddedTargets`, mirroring `collection_proxy.rb:33`
(`def target; @association.target; end`) and `:53` (`loaded?`).

One residue remains. `_seat()`
(`packages/activerecord/src/associations/collection-proxy.ts`) reads
`this._record._associationInstances.get(this._assocName)` and, when that slot is
empty or holds one of the minimal ad-hoc singular holders seeded by
`packages/activerecord/src/associations.ts` and
`packages/activerecord/src/support/seed-association-cache.ts`, falls back to a
lazily built `_ownSeat` plain object (`TargetSeat`).

Rails has no such thing: `CollectionProxy#initialize` is handed the association
(`collection_proxy.rb:31-35`), so `@association` is always the real
`CollectionAssociation` and there is exactly one `@target` in the system. The
fallback exists only because trails resolves the association out of the
per-record cache lazily, and that cache can be occupied by an ad-hoc holder for
a name that IS a declared collection.

Two earlier shapes were tried and rejected in #6683, both regressions:

- Resolving through `Base#association` recurses — it re-syncs the cache, which
  reads loadedness back off this proxy.
- Building the real association in `_seat()` and overwriting the cache slot
  boxes a singular holder's record into an array; it reddened
  `associations.test.ts` "preload with available records with through
  association" and `inverse-associations.test.ts` "has_one createBang stores a
  single record as target, not an array".

The invariant that keeps the fallback harmless today is documented on `_seat()`:
every writer of `_target`/`_targetLoaded` reaches `_collectionAssociation()` /
`_staleWrapper()` first, and the preloader calls `owner.association(name)`
before `_hydrateFromPreload` (`preloader/association.ts`, `preloader/batch.ts`).
It is an invariant a future writer can silently break.

## Converged shape

- The proxy holds its `CollectionAssociation` the way Rails does — handed in at
  construction, or resolved once without a path that can return an ad-hoc
  holder for a declared collection name.
- `_ownSeat` and the `TargetSeat` fallback branch are deleted; `_seat()` returns
  the association, or the accessors read it directly.
- The ad-hoc singular holders no longer occupy the cache slot of a DECLARED
  collection association (the root cause), so no upgrade/boxing step is needed.

## Acceptance criteria

- [ ] `_ownSeat` no longer exists in `collection-proxy.ts`.
- [ ] The two tests named above stay green, as do the association, preload,
      autosave and nested-attributes suites, on SQLite, PostgreSQL and
      MySQL/MariaDB.
- [ ] No new `parity:api:extra` surface; `pnpm parity:api:calls` / `:args` green.
