---
title: "Store accessor *Was/*Change returns undefined on new record; Rails returns nil"
status: ready
updated: 2026-06-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`store_test.rb` "new record and no accessors changes":

```ruby
user = Admin::User.new
assert_nil user.color_was    # → nil
assert_nil user.color_change # → nil
```

Our `store.test.ts` (PR #4205) comments these out and does not assert, because `colorWas()` and `colorChange()` return `undefined` (not `null`) when a store attribute has never been set on a new record.

Root cause: the dirty-tracking `*Was` / `*Change` methods return `undefined` when `attributeChanged` is false (no previous value recorded), whereas Rails returns `nil` for both cases.

Relevant files:

- `packages/activerecord/src/store.test.ts:109-112` — commented-out nil assertions
- `packages/activerecord/src/attribute-methods/dirty.ts` — `*Was` / `*Change` implementations
- `vendor/rails/activerecord/test/cases/store_test.rb:98-99`

## Acceptance criteria

- [ ] `*Was` and `*Change` store accessor dirty methods return `null` (not `undefined`) when the attribute has never been set on a new record, matching Rails `nil`
- [ ] `store.test.ts` assertions for `colorWas()` and `colorChange()` on a new record un-commented and asserting `toBeNull()`
