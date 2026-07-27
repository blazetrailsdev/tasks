---
title: "Displacement removal failure is discarded when the owner is never saved"
status: ready
updated: 2026-07-27
rfc: "0068-awaitable-has-one-setter"
cluster: null
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

The nested-attributes has_one displacement removal added by PR #5290
(`removeDisplacedAtAssignment` / `awaitPendingDisplacedRemovals`,
`packages/activerecord/src/nested-attributes.ts`) starts the removal inline at
assignment — matching Rails — but captures its rejection and rethrows it only
when the list is drained, in the nested-attributes `save` wrapper.

If the owner is never saved, the error is silently discarded. Rails runs
`remove_target!` inline inside `replace` and raises at the assignment itself
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:95-115`
-> `RecordNotSaved` when the nullify save fails), so `pirate.ship_attributes =
{...}` surfaces the failure immediately regardless of any later save.

The capture is deliberate — a floating rejection on a never-drained removal
would surface as an unhandled rejection — so this is a narrowing of the
deviation, not a fix for it. A synchronous property setter cannot raise on an
async write failure at all, so closing this likely means deciding what the
observable contract is (e.g. surfacing on the next association read, or an
awaitable nested-attributes writer analogous to RFC 0068's `set#{Name}`).

## Acceptance criteria

- [ ] Decide and document the contract for a displacement removal that fails
      when the owner is never saved; the current silent discard is not it.
- [ ] Whatever the contract, the failure is observable somewhere other than a
      drained `save()`.
- [ ] No unhandled promise rejection for a never-drained removal.
