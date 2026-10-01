---
title: "converge Relation#new, application_record_class? and find_by's residual shape"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
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

Three residual shape gaps next to bodies PR 8357 converged.

1. `Relation#new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:125-132`) is
   `block = current_scope_restoring_block(&block)` then `scoping { _new(attributes, &block) }`.
   `packages/activerecord/src/relation.ts` wraps the block only when one is given
   (`block ? this.currentScopeRestoringBlock(block) : undefined`) and sets / restores the current
   scope by hand in a `try` / `finally` where Rails calls `scoping`.
2. `application_record_class?` (`activerecord/lib/active_record/core.rb:125`) tests
   `defined?(ApplicationRecord) && self == ApplicationRecord`. `core.ts#isApplicationRecordClass`
   reads `globalThis["ApplicationRecord"]`; CLAUDE.md § "Call-time constant resolution" seats a
   top-level constant on `TopLevel` (`activesupport/src/namespaces.ts`) and rejects a `globalThis` seat.
3. `find_by` (`core.rb:289-327`) accumulates into one Hash (`h[key] = value`) and ends with
   `cached_find_by(hash.keys, hash.values)`. `core.ts#findBy` keeps two parallel arrays, adds a
   `keys.length === 0` early return Rails does not have, and answers `respond_to?` through the
   file-local `respondsTo` / `respondsToId` helpers where the rest of the package uses `rbObjRespondTo`.

## Acceptance criteria

- [ ] `Relation#new` wraps the block unconditionally and goes through `scoping`.
- [ ] `isApplicationRecordClass` reads `TopLevel.ApplicationRecord`, with whatever seats it today moved to match.
- [ ] `findBy` accumulates into one keyed collection, drops the empty-keys arm, and uses `rbObjRespondTo`; the `respondsTo` helpers are deleted.
