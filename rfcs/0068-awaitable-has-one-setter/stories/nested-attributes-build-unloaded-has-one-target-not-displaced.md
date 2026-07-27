---
title: "Nested-attributes build on an unloaded has_one leaves the displaced row attached"
status: ready
updated: 2026-07-27
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5442 made every has_one build run Rails' leading `load_target`: Rails'
`set_new_record` -> `replace(record, false)` guards with `return target unless
load_target || record` (`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:62`),
and Ruby always evaluates the left operand, so a build on a persisted owner
discovers an existing row even when the association was never loaded.

That load lives in `SingularAssociation#build` ->
`loadDisplacedForBuild` (`packages/activerecord/src/associations/singular-association.ts`,
`packages/activerecord/src/associations/has-one-association.ts`), and it is
SUPPRESSED for the nested-attributes writer: `assignNestedAttributesForOneToOne`
sets `buildDisplacementOwnedByCaller` around its `assoc.build(assignable)` call
(`packages/activerecord/src/nested-attributes.ts:838-853`), because the writer is
a synchronous property setter (`pirate.shipAttributes = {...}`) that cannot
await a SELECT.

Consequence: `pirate.shipAttributes = { name: "..." }` on an owner whose `ship`
association was never loaded displaces nothing — the existing row keeps its
foreign key. The loaded case IS covered (`detachDisplacedAtAssignment` ->
`detachDisplacedRecord`, drained by the nested-attributes `save` wrapper); only
the unloaded case is blind. Rails' `build_#{name}` loads and removes in both.

Same bug class as this story's parent (#5442), one entry point over.

## Acceptance criteria

- [ ] Nested-attributes assignment that replaces an UNLOADED, persisted has_one
      target removes the displaced record (FK nullified, or destroyed/deleted
      per `:dependent`), matching Rails' `load_target` + `remove_target!`.
- [ ] The query is issued at assignment (as Rails does), not deferred to the
      owner's `save()`; only its completion may be drained there, matching the
      existing `_pendingDisplacedRemovals` mechanism.
- [ ] Regression test in
      `packages/activerecord/src/associations/has-one-sync-build-displacement.trails.test.ts`
      (or the nested-attributes suite), verified failing on the pre-fix baseline.
- [ ] `buildDisplacementOwnedByCaller`'s JSDoc updated if the writer stops
      owning the load.
