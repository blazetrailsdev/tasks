---
title: "activerecord: Callbacks#destroy lives in Base#_destroyRow and persistence.ts, not callbacks.ts"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing trails#8474 (`activerecord-converge-invented-control-flow-arms-associations-part-2`).

Rails layers `destroy` across three modules. `Callbacks#destroy`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/callbacks.rb:419-428`) is:

```ruby
def destroy # :nodoc:
  @_destroy_callback_already_called ||= false
  return true if @_destroy_callback_already_called
  @_destroy_callback_already_called = true
  _run_destroy_callbacks { super }
rescue RecordNotDestroyed => e
  @_association_destroy_exception = e
  false
ensure
  @_destroy_callback_already_called = false
end
```

trails has no `destroy` in `packages/activerecord/src/callbacks.ts`. The layer is split between
`persistence.ts#destroy` (the `_destroyCallbackAlreadyCalled` guard and `finally`, wrapped around
`withTransactionReturningStatus`, which is Transactions' layer) and the trails-only
`Base#_destroyRow` in `base.ts` (the `runCallbacks("destroy")` call, and since #8474 the
`rescue RecordNotDestroyed` that sets `_associationDestroyException` and returns `false`).
`_destroyRow` also opens with `_preloadBelongsToForDestroyCallbacks()`, a call Rails does not make.

## Acceptance criteria

- [ ] `callbacks.ts` defines `destroy` with the Rails body above, reached through the module chain
      between Transactions' and Persistence's `destroy` as `super`.
- [ ] `persistence.ts#destroy` is Rails' `Persistence#destroy` (`persistence.rb`) with no callback
      guard, and `Base#_destroyRow` is deleted.
- [ ] `associations/builder-control-flow.trails.test.ts` ("destroy rescues a RecordNotDestroyed
      raised by any before_destroy callback") still passes.
