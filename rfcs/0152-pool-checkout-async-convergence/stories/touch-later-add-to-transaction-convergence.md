---
title: "TouchLater#touch_later: call add_to_transaction, drop the connection probe and early return"
status: in-progress
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8030
claim: "2026-09-24T13:26:46Z"
assignee: "converge-migration-connection-cold-arm-onto-awaited-lease"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TouchLater#touch_later` (`activerecord/lib/active_record/touch_later.rb:11-36`) runs
`surreptitiously_touch @_defer_touch_attrs`, then `add_to_transaction`, then
`@_new_record_before_last_commit ||= false`, then touches every `touch:` parent through
`Builder::BelongsTo.touch_record` / `Builder::HasOne.touch_record`, unconditionally.
`add_to_transaction` (`transactions.rb:512-516`) is
`self.class.with_connection { |connection| connection.add_transaction_record(self, ensure_finalize) }`.

trails' `touchLater` (`packages/activerecord/src/touch-later.ts`) instead reads the deprecated
`ctor.connection` (awaited since trails#8021) and probes it by hand. If it finds
`addTransactionRecord` and an open real `currentTransaction()`, it calls
`adapter.addTransactionRecord(this)` without `ensure_finalize`. Otherwise it calls
`touchDeferredAttributes` immediately and **returns early, skipping the parent touches**.
trails already has a faithful `addToTransaction` (`transactions.ts:396`) that it never calls here,
and `@_new_record_before_last_commit ||= false` is not ported.

## Acceptance criteria

- `touchLater` follows `touch_later.rb:11-36` in order: `surreptitiouslyTouch`, `addToTransaction`,
  the `_newRecordBeforeLastCommit ||= false` seat, then the parent `touch_record` loop with no early
  return.
- The hand-rolled `ctor.connection` / `currentTransaction()` probe and the immediate
  `touchDeferredAttributes` arm are deleted. Deferred touches outside a real transaction are
  flushed however Rails flushes them (`before_committed!` / `touch_deferred_attributes` via the
  transaction record), verified against `test/cases/touch_later_test.rb`.
- `touch-later.test.ts` stays green on sqlite, PG and MySQL.
