---
title: "assoc-has-many-counter-cache-clear"
status: in-progress
updated: 2026-06-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4245
claim: "2026-06-28T20:56:52Z"
assignee: "assoc-has-many-counter-cache-clear"
blocked-by: null
---

## Context

`Topic.has_many :approved_replies, counter_cache: "replies_count"` in Rails. When
`topic.approved_replies.clear` is called, Rails decrements `replies_count` by the count
of cleared records.

In trails `packages/activerecord/src/associations/collection-proxy.ts`, the `clear()` method
follows the `dep === undefined` → nullify path (SQL UPDATE SET parent_id = NULL). No counter cache
decrement is applied in this path. The belongs_to counterCache callback also doesn't fire
because the SQL UPDATE bypasses ActiveRecord callbacks.

The `delete(records)` path at line 2269 does call `_decrementCounterCache`, but `clear()` does not.

Rails source:

- `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:2886`
  `test_custom_named_counter_cache` (topics(:first).approved_replies.clear)

Skipped in `packages/activerecord/src/associations/has-many-associations.test.ts`
("custom named counter cache").

## Acceptance criteria

- [ ] `clear()` decrements the has_many's `counterCache` column after a nullify SQL UPDATE
- [ ] Test `"custom named counter cache"` un-skipped and passing
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts` passes
