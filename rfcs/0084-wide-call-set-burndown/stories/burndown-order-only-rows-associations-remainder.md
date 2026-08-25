---
title: "burndown-order-only-rows-associations-remainder"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6379
claim: "2026-08-11T21:26:07Z"
assignee: "burndown-order-only-rows-associations-remainder"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to PR for `burndown-order-only-rows-associations`, which converged 4
of the 24 `order:` rows under
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/`:

- `belongs-to-association.ts::default` (`order:owner,writer`)
- `has-many-through-association.ts::transaction` (`order:throughReflection,klass`)
- `has-many-association.ts::deleteOrNullifyAllRecords` (`order:scope,deleteCount`)
- `collection-association.ts::isInclude` (`order:isLoaded,isIncludeInMemory`)

The 20 that remain, with what each actually needs:

- `association-scope.ts::nextChainScope`, `join-dependency.ts::aliases`,
  `preloader/branch.ts::preloadersForReflection`,
  `preloader/through-association.ts::{sourcePreloaders,throughPreloaders,throughScope}`
  — the port memoizes / defends where Rails does neither, so the whole
  skeleton is reshaped, not merely reordered.
- `belongs-to-association.ts::handleDependency`, `has-many-association.ts::handleDependency`,
  `has-one-association.ts::delete` — the `:destroy_async` branch is missing
  entirely (`enqueue_destroy_association`); the order row is a symptom.
- `has-one-association.ts::handleDependency` — remaining delta is trails'
  two-arg `DeleteRestrictionError(record, association)` vs Rails'
  `DeleteRestrictionError.new(reflection.name)` (associations/errors.ts:359,
  vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:11),
  plus the `throw(:abort)` → `return false` deviation.
- `has-one-association.ts::{foreignKeyPresent,setOwnerAttributes}`,
  `belongs-to-polymorphic-association.ts::inverseReflectionFor`,
  `has-many-association.ts::deleteRecords`,
  `has-many-through-association.ts::deleteRecords`,
  `association.ts::{inverseAssociationFor,matchesForeignKey}`,
  `collection-association.ts::{idsWriter,build,loadTarget}`,
  `belongs-to-association.ts::updateCounters` — each needs the rich-reflection
  resolve (`owner.constructor._reflectOnAssociation(...)`) that `this.reflection`
  (the lightweight `AssociationDefinition`) forces, or a dropped Rails branch,
  restored first.

**Extractor asymmetry to check before editing any body**: for a chained call
`a.b.c(...)`, the Ruby extractor emits refs outermost-first (`c, b, a`) while
the TS extractor emits them in evaluation order (`a, b, c`). Several remaining
rows (e.g. `through_scope`'s `order:klass,unscoped` against
`through_reflection.klass.unscoped`) are that shape and cannot be closed by
editing the port at all. Confirm the row is a real divergence against
`output/call-skeletons.json` before rewriting a body; if it is the asymmetry,
fix the extractor (or record it) rather than the port.

## Acceptance criteria

- [ ] For each remaining `order:` row in
      `call-mismatches-exclude/activerecord/associations/**`, read the Rails body
      at its `file:line` and either converge the TS branch/call order to it, or
      show it is the extractor asymmetry above and fix that.
- [ ] Each converged row is DELETED from its shard by hand via
      `serializeBaseline` (only-shrink; no `--write`/reseed).
- [ ] No row is closed by rewording its reason; no new `order:` row added.
- [ ] `pnpm parity:api:calls` green and the AR suites pass on all three adapter lanes.
