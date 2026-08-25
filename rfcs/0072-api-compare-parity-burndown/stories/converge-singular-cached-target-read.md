---
title: "converge-singular-cached-target-read"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6136
claim: "2026-08-05T16:53:06Z"
assignee: "date-to-s-does-not-zero-pad-the-year"
blocked-by: null
closed-reason: null
---

## Context

After #5911 collapsed the singular dispatcher, the unified
`findTarget` in `packages/activerecord/src/associations/singular-association.ts`
still opens with a macro-conditional cached-target read — `_belongsToCachedHit`
for belongs_to, a bare `_loadedSingularTarget` early return for has_one. #5911
justified it as "Rails caches on the association instance, trails on the owner",
which is true but is not the whole picture: Rails' `find_target` does not read a
cache at all.

- Rails puts the read one level up, in `load_target`
  (`vendor/rails/activerecord/lib/active_record/associations/association.rb:190`):
  `@target = find_target(async: false) if (@stale_state && stale_target?) || find_target?`.
  `SingularAssociation#find_target` (`singular_association.rb:47-55`) is a pure
  query.
- trails already mirrors that shape: `Association#loadTarget`
  (`associations/association.ts:519-553`) reproduces the guard and consults
  `doFindTarget()` (`association.ts:665-679`) — the owner-side
  `_associationCache` + `_preloadedHolderTarget` read — calling the engine
  `findTarget` only on a miss.

So on the `Association` path the engine's cached read is a redundant second copy
of `doFindTarget`. It is load-bearing only for callers that bypass the
association object: `loadBelongsTo` / `loadHasOne`
(`associations/instance-methods.ts:164,182`), `delegate.ts`, the through
loaders, and direct test calls. Those are trails entry points; Rails' equivalent
is `record.association(name).load_target`.

Two things are bundled into `_belongsToCachedHit` besides the read, and they are
the actual work here:

- `stale_target?` handling, which Rails does in `load_target`'s guard.
  `Association#loadTarget` already relaxes that guard for trails' async reader
  (`association.ts:526-538`), so the two staleness rules must be reconciled
  rather than one deleted.
- `inverse_of` validation on a cached hit — including when the cached value is
  null — which is a trails artifact of validating lazily at load time instead of
  at `check_validity!` time.

## Acceptance criteria

- Direct singular-loader callers (`loadBelongsTo` / `loadHasOne`, `delegate.ts`,
  the through loaders, and test call sites) reach the target through
  `association(name).loadTarget()` rather than calling the engine `findTarget`
  with its own cache read.
- `_belongsToCachedHit` and the has_one `_loadedSingularTarget` early return are
  gone from `findTarget`, leaving it a pure query as in
  `singular_association.rb:47-55`.
- Staleness is decided in one place — `loadTarget`'s guard — with the existing
  trails relaxation preserved and documented at that single site.
- The cached-hit `inverse_of` validation lands wherever it is honest (ideally
  `check_validity!` time); if it must stay lazy, it is justified at its new call
  site, not inside the loader.
- `associations/singular-association.ts` stays at 0 novel extra surface and adds
  no wide call-mismatch baseline entries.
- Association / strict-loading / preloader suites pass on SQLite, PostgreSQL and
  MySQL with no test renames.
