---
title: "converge SingularAssociation#reader onto Rails' reload-if-unloaded shape"
status: draft
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
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

Rails `SingularAssociation#reader` (`activerecord/lib/active_record/associations/singular_association.rb:7-15`) is:

```ruby
def reader
  ensure_klass_exists!
  if !loaded? || stale_target?
    reload
  end
  target
end
```

and `load_target` (`association.rb:189-196`) does `@target = find_target if (@stale_state && stale_target?) || find_target?; loaded! unless loaded?`.

trails' `packages/activerecord/src/associations/singular-association.ts` `get reader()` (~:74-105) instead inlines a branch ladder: loaded/stale → reload; `target != null` → `loadedBang()`; a `doFindTarget()` cache probe; `findTargetNeeded()` → strict-loading check + `loadTarget()`; else `loadedBang()` + target. There is no `ensureKlassExists` call and no `reload` on the unloaded path. trails#7738 added the trailing `loadedBang()` so `Client.select(:id).first.firm` raises `MissingAttributeError` (`belongs_to_associations_test.rb:87-89`), but the shape is still not Rails'.

## Acceptance criteria

- `reader` mirrors `singular_association.rb:7-15`: `ensureKlassExists()`, then `if (!isLoaded() || isStaleTarget()) reload()` (async branch returning the Promise), then `target`.
- The strict-loading check and cache probe live where Rails has them (`find_target` / `violates_strict_loading?`), not inline in `reader`.
- `parity:api:calls` gains no rows; belongs-to / has-one / strict-loading suites green on all adapters.
