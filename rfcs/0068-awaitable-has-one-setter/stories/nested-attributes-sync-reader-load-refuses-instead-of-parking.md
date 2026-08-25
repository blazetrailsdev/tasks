---
title: "Retire the nested-attributes sync setter's parked reader load"
status: closed
updated: 2026-08-03
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by 0087-awaitable-association-writers-only/delete-nested-attributes-deferred-displacement + migrate-nested-attributes-assignments-to-awaitable-writer, which delete the synchronous #{name}Attributes= setter outright — the parked reader load goes with it. Filed before I saw RFC 0087; the surviving detail worth carrying over is that _pendingDisplacedRemovals is now named _pendingNestedReaderLoads and holds only the hasId/updateOnly reader re-entry (Rails' synchronous send(association_name), nested_attributes.rb:434), the displacement half having been deleted by PR #5997."
---

## Context

PR #5997 retired the nested-attributes sync setter's _displacement_ deferral
(RFC 0068 Design §6, reversed): a displacing
`pirate.shipAttributes = {...}` now raises `NestedAttributesDisplacementError`
rather than parking a write. One deferral survived it.

Rails reads the existing record with a plain synchronous
`send(association_name)`
(`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:434`, inside
`assign_nested_attributes_for_one_to_one_association` at :423). Trails'
analogue — `SingularAssociation#reader` — returns a _promise_ when the
association is unloaded, and the Rails-named property setter cannot await it.
So `assignNestedAttributesForOneToOneAssociation`
(`packages/activerecord/src/nested-attributes.ts`) re-enters its own body
asynchronously on the `hasId || updateOnly` arm and parks the re-entry:

- `parkNestedReaderLoad` pushes it onto the owner's `_pendingNestedReaderLoads`.
- `awaitPendingNestedReaderLoads` drains it in the `acceptsNestedAttributesFor`
  `save` wrapper, before `originalSave`.
- The awaitable `set#{Name}Attributes` writer returns the re-entry directly
  instead (the `awaitable` parameter), so it is already Rails-timed.

That leaves the assignment expression returning before the record it is supposed
to have read exists — `pirate.shipAttributes = {id: 1, name: "x"}` on an
unloaded ship reads back nothing until `save()`. Rails has assigned by the time
`=` returns.

The trails-only machinery this keeps alive: `_pendingNestedReaderLoads`,
`parkNestedReaderLoad`, `awaitPendingNestedReaderLoads`, the `awaitable`
parameter on `assignNestedAttributesForOneToOneAssociation`, and the drain in
the save wrapper. `HasOneAssociation#displacementNeedsAwait` goes with it if the
sync setter stops accepting any I/O-bearing assignment at all.

## Converged shape

Same call the displacement half took, and the same one Design §2 took for
`owner.account = x`: the synchronous setter refuses rather than defers. When the
`hasId || updateOnly` arm finds `assoc.isLoaded() === false` and the reader is a
promise, raise (reusing `NestedAttributesDisplacementError`, or a sibling naming
the same `await owner.set#{Name}Attributes({...})` replacement) instead of
parking. The awaitable writer already awaits the reader and re-enters correctly,
so it needs no change; the parked list, its drain, and the save-wrapper hook
then delete.

Blast radius to measure first: the arm is reached from
`assign_attributes` / `new` with an `id`-bearing or `update_only` nested hash on
a persisted owner whose association is unloaded. `#update` is NOT affected — it
routes nested keys through the awaitable writer
(`assignUpdateAttribute`, `packages/activerecord/src/persistence.ts`). PR #5997
found four such call sites for the displacement half across the whole
Rails-ported suite; expect a similar order here.

## Acceptance criteria

- [ ] The `hasId || updateOnly` unloaded-reader arm raises from the synchronous
      setter instead of parking a re-entry.
- [ ] `_pendingNestedReaderLoads`, `parkNestedReaderLoad`,
      `awaitPendingNestedReaderLoads` and the `save`-wrapper drain are deleted.
- [ ] The awaitable `set#{Name}Attributes` path still assigns through the
      reader, in Rails' order, with no behavior change.
- [ ] `nested-attributes-unloaded-update.trails.test.ts` covers the new
      contract; Rails-ported nested-attributes tests still pass.
- [ ] Whether `displacementNeedsAwait` and the `awaitable` parameter can go too
      is answered in the PR (they can if no I/O-bearing assignment survives on
      the sync path).
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
