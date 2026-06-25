---
title: "belongs_to sync read in before_destroy on direct (non-cascade) destroy"
status: claimed
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-25T11:39:32Z"
assignee: "belongs-to-sync-read-direct-destroy-callback"
blocked-by: null
---

## Context

Surfaced while implementing `has-one-destroy-callback-inverse-sync-convergence`
(PR #4102). That PR made the `dependent: :destroy` cascade preload the child's
FK-matching `belongs_to` so a sync `before_destroy` reads a freshly-queried
parent (`has-one-association.ts` `preloadDestroyInverseBelongsTo`).

The cascade path is now Rails-faithful, but a **direct** destroy is not. When
an `Account` with an _unloaded_ `firm` is destroyed directly
(`await account.destroy()`, not via `firm.destroy()`), trails' async
`belongs_to` reader surfaces `account.firm` as a Promise, so the model's
`before_destroy` guard (`firm && firm.id != null`,
`test-helpers/models/account.ts`) skips it and `destroyed_account_ids` is NOT
recorded. Rails issues the lazy synchronous query inside the callback even on a
direct destroy (`vendor/rails/activerecord/test/models/account.rb`
`before_destroy { |account| ... if account.firm }`), so it DOES record the id.

Root cause is the same async-reader limitation: a sync callback cannot await an
unloaded `belongs_to`. The cascade path works around it by preloading; the
direct path has no such hook. A general fix is a sync-capable `belongs_to`
reader path usable from destroy callbacks (or pre-resolving `belongs_to` the
callback will touch before running `destroy`'s before-callbacks).

## Acceptance criteria

- A direct `account.destroy()` on an Account with an unloaded `firm` records
  `Account.destroyedAccountIds()[firm.id]`, matching Rails.
- No regression in the dependent-cascade path (PR #4102) or has_one/belongs_to
  inverse/autosave tests on sqlite/pg/mysql.
- Account model `before_destroy` guard converges toward Rails' bare
  `if account.firm` (drop the trails-specific `firm.id != null` Promise filter)
  once the reader no longer surfaces a Promise.
