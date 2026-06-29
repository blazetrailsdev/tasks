---
title: "collection-proxy-destroy-through-transaction"
status: claimed
updated: 2026-06-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-29T13:46:09Z"
assignee: "collection-proxy-destroy-through-transaction"
blocked-by: null
---

## Context

`CollectionProxy#destroy` now wraps the destroy batch in a transaction (`collection-proxy.ts`, PR #4225), matching Rails `delete_or_destroy → transaction { remove_records(...) }` (`collection_association.rb:391-395`).

However, for `has_many :through` associations, `_deleteThrough` runs _outside_ that transaction. In Rails, `HasManyThroughAssociation#delete_records` calls `scope.destroy_all` and `delete_through_records` _inside_ `transaction { remove_records(...) }` (`has_many_through_association.rb:148-163`), making join-row deletion atomic with the record destroy. In trails, a failure in `_deleteThrough` after the committed `run()` transaction would leave target records destroyed but join rows orphaned.

Relevant files:

- `packages/activerecord/src/associations/collection-proxy.ts` — `destroy` method (~line 2468)
- `vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:148-163`

## Acceptance criteria

- [ ] For `has_many :through`, join-row deletion (`_deleteThrough`) is performed inside the same transaction as the record `destroy` loop, matching Rails `HasManyThroughAssociation#delete_records` atomicity.
- [ ] A mid-batch raise (or `_deleteThrough` failure) rolls back both the destroy and the join-row deletion atomically.
- [ ] No regression in existing through-association destroy tests.
