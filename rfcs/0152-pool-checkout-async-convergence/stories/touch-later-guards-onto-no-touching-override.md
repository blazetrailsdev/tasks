---
title: "TouchLater#touch_later: move no_touching guard to NoTouching#touch_later, drop readonly guard"
status: ready
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 90
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8030 (touch-later-add-to-transaction-convergence). The body of `touchLater`
(`packages/activerecord/src/touch-later.ts`) now follows `touch_later.rb:11-36`, but its head still
has two guards that Rails does not put in `TouchLater#touch_later`:

- `if (this.isReadonly()) throw new ReadOnlyRecord(...)`: Rails' `touch_later`
  (`vendor/rails/activerecord/lib/active_record/touch_later.rb:11-12`) only runs
  `_raise_record_not_touched_error unless persisted?`. The readonly check belongs to `touch`, which
  the deferred flush reaches through `touch_deferred_attributes`.
- `if (isNoTouchingApplied(ctor)) return`: in Rails this is `NoTouching#touch_later`
  (`vendor/rails/activerecord/lib/active_record/no_touching.rb:57-59`, `super unless no_touching?`),
  a separate module override placed above `TouchLater` in the ancestor chain, not a guard inside
  `TouchLater`.

## Acceptance criteria

- `TouchLater.touchLater` starts with only the `persisted?` raise, as `touch_later.rb:12` does.
- The no-touching check moves to `no-touching.ts` as the `touch_later` override (`super unless no_touching?`),
  using the settled mixin/`include` super idiom, and calls `isNoTouching()`.
- The readonly check is removed from `touchLater`. It is verified that `ReadOnlyRecord` still raises
  where Rails raises it. `touch-later.test.ts` and `no-touching` / `timestamp.test.ts` stay green on all three adapters.
