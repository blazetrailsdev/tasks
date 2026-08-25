---
title: "Singular find_target still writes back — Rails' body ends at scope.first"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6139
claim: "2026-08-05T19:53:07Z"
assignee: "date-package-scaffold"
blocked-by: null
closed-reason: null
---

## Context

`converge-singular-cached-target-read` (PR #6136) removed the cached-target
_read_ from the singular engine loader, so
`packages/activerecord/src/associations/singular-association.ts#findTarget` now
opens as a pure query, matching
`vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:47-55`:

```ruby
def find_target(async: false)
  if disable_joins
    if async then scope.load_async.then(&:first) else scope.first end
  else
    super
  end
end
```

Rails' body ends at `scope.first` — it returns the record and writes nothing
back into the association. trails' body still ends with a _write_:

- `syncToAssociationInstance(record, assocName, result)`
  (`singular-association.ts:536`) pushes the loaded target into the owner's
  holder, and
- the block just above it (`singular-association.ts:~515-535`) re-reads the
  belongs_to stale columns after the await and, if they moved, returns the
  holder's target instead of the row it just fetched.

Both were load-bearing while direct callers bypassed the association object.
They no longer are: after #6136 every caller — `loadBelongsTo` / `loadHasOne`,
`delegate.ts`, both through loaders, `test-helpers/load-singular-target.ts` —
reaches this body through `Association#loadTarget`, which does its own
writeback via `_setTargetFromLoader` (`association.ts:190` guard,
`_findTarget` assignment). So the tail is now a second, redundant writeback
path, and the stale reconciliation is a second staleness rule alongside
`loadTarget`'s guard — the exact duplication #6136 set out to remove, one step
further down.

The mid-flight guard itself is a real trails concern (Rails' `find_target` is
synchronous and cannot observe an FK change mid-load), so this is a
consolidation, not a deletion: the reconciliation belongs at the single
writeback site in `Association`, next to `_loaderWritebackSuppressed`, not in
the query body.

## Converged shape

`findTarget` ends at the query result, as `singular_association.rb:47-55` does:

- `syncToAssociationInstance` drops out of the loader; `loadTarget` /
  `_setTargetFromLoader` remain the only writeback.
- The post-await stale-column reconciliation moves to that single writeback
  site, so staleness is decided in one place (`loadTarget`'s guard) and the
  in-flight race is handled in one place.
- `_loaderWritebackSuppressed`, which exists only to stop the loader's tail
  from clobbering a holder target set mid-await, is re-examined: with no tail
  writeback it may be retirable outright.

## Acceptance criteria

- [ ] `singular-association.ts#findTarget` performs no holder writeback and no
      staleness re-check; it returns the query result.
- [ ] The mid-flight FK-change guard is preserved, at the `Association`
      writeback site, and justified there.
- [ ] `_loaderWritebackSuppressed` is retired, or its remaining need is stated
      at its definition.
- [ ] Association / strict-loading / preloader suites pass on SQLite,
      PostgreSQL and MySQL with no test renames.
- [ ] No new wide call-mismatch baseline rows; `singular-association.ts` stays
      at 0 novel extra surface.
