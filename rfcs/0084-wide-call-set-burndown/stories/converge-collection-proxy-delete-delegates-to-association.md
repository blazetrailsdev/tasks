---
title: "Delegate CollectionProxy's removal path to the association instead of re-spelling remove_records"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6435
claim: "2026-08-12T20:16:53Z"
assignee: "converge-memory-store-dupcoder-and-pruning-guard"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy#delete` / `#destroy` are one-line delegations to the
association (`activerecord/lib/active_record/associations/collection_proxy.rb`):
the whole removal body — type-check, the single `catch(:abort)` around the
`before_remove` loop, `delete_records`, the `@target` prune, `after_remove` —
lives once in `CollectionAssociation#remove_records`
(`collection_association.rb:399-408`) and `#delete_or_destroy` (`:385-390`).

trails' `CollectionProxy#_removeRecords`
(`packages/activerecord/src/associations/collection-proxy.ts`, ~line 2217-2310)
re-spells that body against the proxy's own target: it repeats
`_raiseOnTypeMismatch`, the before_remove loop (which PR #6432 had to give its
own hand-written `catch(:abort)`, the third copy in the cluster), the
destroy/delete_all/nullify dispatch that is `HasManyAssociation#delete_records`
(`has_many_association.rb:107-142`), the counter-cache decrement, the target
prune and the after_remove loop. The same shape sits on `createBang`'s through
arm (~line 3517), where the `before_add` abort is caught a second time outside
`replace_on_target`.

The sibling story `converge-collection-proxy-create-delegates-to-association`
(0084, blocked) covers the create side; this is the delete side.

## Converged shape

`CollectionProxy`'s removal path delegates to the association
(`@association.delete(*records)` / `destroy`), so `remove_records` is the ONE
body that fires the collection callbacks and the ONE place the abort is caught
— matching what PR #6432 established for the association itself. The proxy
keeps only what `collection_proxy.rb` actually spells.

Check the blocked create-side story's blocker first: if the through/async proxy
paths are what force the duplication, this story may need the same treatment
(`pnpm tasks block` with the specific finding) rather than a partial converge.

## Acceptance criteria

- [ ] `CollectionProxy` removal routes through the association's
      `delete`/`destroy` rather than re-spelling `remove_records`.
- [ ] The proxy-side `catch(:abort)` copies are gone; the abort is caught only
      at the Rails call sites in `collection-association.ts`.
- [ ] No baseline row added; any row the converge retires is deleted by hand.
- [ ] `packages/activerecord/src/associations` green, including the
      before_remove abort and `dependent: :destroy` counter-cache tests.
