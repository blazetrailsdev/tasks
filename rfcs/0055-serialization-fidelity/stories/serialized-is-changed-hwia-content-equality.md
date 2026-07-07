---
title: "Serialized#isChanged uses reference equality for HWIA; Rails uses content equality"
status: done
updated: 2026-07-07
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 54
pr: 4746
claim: "2026-07-07T16:13:49Z"
assignee: "serialized-is-changed-hwia-content-equality"
blocked-by: null
---

## Context

`store_test.rb` "updating the store and changing it back won't mark accessor as changed":

```ruby
@john.color = "red"
assert_equal "black", @john.color_was
@john.color = "black"
assert_not_predicate @john, :settings_changed?
assert_not_predicate @john, :color_changed?
```

Rails recognizes write→revert as unchanged because Ruby's `==` compares HWIA by content. Our `Serialized#isChanged` uses `===` (reference equality): writing `"red"` then `"black"` produces two different HWIA objects, both distinct from the original, so the attribute is always "changed" even after reverting.

`store.test.ts` (PR #4205) has `it.skip` on this test with a convergence comment.

Relevant files:

- `packages/activerecord/src/type/serialized.ts` — no `isChanged` override; falls through to `Value#isChanged` which uses `===`
- `packages/activesupport/src/hash-with-indifferent-access.ts` — HWIA has no `equals()` method
- `vendor/rails/activerecord/test/cases/store_test.rb:113-118`
- `packages/activerecord/src/store.test.ts` — `it.skip` on "updating the store and changing it back"

## Acceptance criteria

- [ ] `Serialized#isChanged` (or `HashWithIndifferentAccess`) implements content-equality comparison so write→revert is recognized as no-change
- [ ] `store.test.ts` "updating the store and changing it back won't mark accessor as changed" un-skipped and passing
