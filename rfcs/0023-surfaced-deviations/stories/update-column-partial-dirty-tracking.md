---
title: "update_column clears all dirty state instead of only written-attribute dirty"
status: ready
updated: 2026-06-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Found during RFC 0019 wave 16 (`persistence.test.ts` canonical conversion, PR #4239).

Rails' `update_column` / `update_columns` only clears dirty tracking for the _written_ attributes — other in-memory dirty attributes remain dirty after the call. Trails calls `changesApplied()` which clears **all** dirty state unconditionally.

Rails source: `activerecord/lib/active_record/attribute_methods/dirty.rb` — `write_attribute_without_dirty_tracking` + `restore_attributes` pattern in `update_columns`.

Concrete case (Rails `test_update_column_with_one_changed_and_one_updated`, `test_update_columns_with_one_changed_and_one_updated`):

```ruby
t = Topic.first
t.author_name = "Dan"          # dirty
t.update_column(:title, "a")   # Rails: title saved, author_name still dirty
assert t.author_name_changed?  # true in Rails, false in trails
```

Both tests were deleted from `persistence.test.ts` in PR #4239 because the impl diverges.

Rails file: `activerecord/lib/active_record/attribute_methods/dirty.rb`  
Trails file: `packages/activerecord/src/persistence.ts` — `changesApplied()` call in `updateColumns`.

## Acceptance criteria

- [ ] `update_column` / `update_columns` only clears dirty tracking for the written attributes; pre-existing dirty attributes on other columns remain dirty after the call.
- [ ] Re-enable (un-delete) "update column with one changed and one updated" and "update columns with one changed and one updated" tests in `persistence.test.ts`.
- [ ] `test:compare` delta non-negative.
