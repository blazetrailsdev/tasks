---
title: "collection-proxy-destroy-fires-before-after-remove-callbacks"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-03T19:55:08Z"
assignee: "collection-proxy-destroy-fires-before-after-remove-callbacks"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#destroy`
(`packages/activerecord/src/associations/collection-proxy.ts` non-through path,
~line 2708-2735) destroys each record via `record.destroy()` directly and
never fires the association's `before_remove` / `after_remove` callbacks. Rails
routes `CollectionAssociation#destroy` → `delete_or_destroy(records, :destroy)`
→ `remove_records` (`collection_association.rb:399-402`), which wraps the batch
in `catch(:abort) { callback(:before_remove, ...) } || return` and fires
`after_remove` afterward — identical to the `delete` path. So in Rails a
`before_remove` that `throw :abort` halts `destroy` and returns nil, and
`after_remove` runs on success.

`CollectionProxy#delete` already fires both callbacks
(`collection-proxy.ts:2439-2444`, 2511-2513) and returns `undefined` on abort
(added in PR #4506). `destroy` diverges: no before/after*remove, so its
abort-return contract is structurally unreachable. PR #4506 made the \_return
value* lockstep (undefined on empty) but could not exercise destroy-abort.

## Acceptance criteria

- [ ] `CollectionProxy#destroy` fires `before_remove` for each record before
      destroying, aborting the whole batch (returning `undefined`, nothing
      destroyed) when any `before_remove` throws :abort — mirroring
      `remove_records`.
- [ ] `after_remove` fires for each record after the destroy batch, matching
      `delete`.
- [ ] Ordering/transaction semantics match `delete` (callbacks + destroys form
      one unit inside the transaction when persisted records exist).
- [ ] Port the Rails callback tests that cover destroy + before_remove/
      after_remove; test names verbatim.
