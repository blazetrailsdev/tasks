---
title: "has-one-destroy-callback-inverse-sync-convergence"
status: claimed
updated: 2026-06-25
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-25T04:42:34Z"
assignee: "has-one-destroy-callback-inverse-sync-convergence"
blocked-by: null
---

## Context

Spun out of `unskip-has-one-associations` / PR #3907 as the tracked
convergence for a deliberate deviation.

That PR converged `HasOneAssociationsTest > dependence` by seeding the
child's inverse `belongs_to` with the in-memory owner before a
`dependent: :destroy` cascade (`has-one-association.ts`
`seedDestroyInverseOwner`), so the child's sync `before_destroy` can read the
parent.

Rails instead relies on the child's `belongs_to` reader issuing a
**synchronous DB query** inside the callback (`Account#before_destroy` reads
`account.firm` to record `destroyed_account_ids[firm.id]`,
`vendor/rails/activerecord/test/models/account.rb`). Two trails-specific
facts force the workaround:

1. our `belongs_to` reader is async, so an unloaded parent surfaces as a
   Promise the sync callback must skip; and
2. the canonical `Account` model carries a `!("then" in firm)` Promise-skip
   guard with no Rails equivalent.

Observable difference: inside the callback `account.firm` returns the
in-memory owner rather than a freshly-queried record — divergent only if the
owner were dirty/stale relative to the DB row.

The interim `seedDestroyInverseOwner` heuristic disambiguates FK-equal
`belongs_to` by "most-general target class" (shallowest prototype-chain depth).
This is a non-Rails invention that happens to match the `Account#firm` (klass
`Company`) vs `Account#unautosaved_firm` (klass `Firm`) pair only because the
primary back-reference is conventionally base-class-typed; on an exact
depth tie (two unrelated sibling subclasses, or two aliases of the same class
on one FK) it still falls back to reflection/declaration order. The real fix
below — a sync `belongs_to` reader resolving the _actual_ reflection the
callback reads — supersedes the heuristic entirely and removes this residual
tie-break fragility.

## Acceptance criteria

- Decide and implement the faithful convergence: either a sync-capable
  `belongs_to` reader path usable from destroy callbacks, or real
  automatic `inverse_of` resolution for the `Company#account` ↔ `Account#firm`
  pair so Rails' own `set_inverse_instance` seeds it (removing the bespoke
  `seedDestroyInverseOwner` FK-match heuristic).
- Once converged, drop `seedDestroyInverseOwner` (or fold it into the general
  inverse mechanism) and remove the `!("then" in firm)` Promise-skip guard
  from the canonical `Account` model if no longer needed.
- `HasOneAssociationsTest > dependence` continues to pass on sqlite/pg/mysql;
  no regression in has_one/belongs_to inverse or autosave tests.
