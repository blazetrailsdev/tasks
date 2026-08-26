---
title: "converge-value-type-changed-to-ruby-equality"
status: draft
updated: 2026-08-26
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced porting `json_shared_test_cases.rb` (PR for story
`port-json-shared-test-cases`, RFC 0112). `test_changes_in_place_ignores_key_order`
is ported but `it.skip`ped at
`packages/activerecord/src/cases/json-shared-test-cases.ts` with the reason
inline.

Rails' `ActiveModel::Type::Value#changed?` is

```ruby
def changed?(old_value, new_value, _new_value_before_type_cast)
  old_value != new_value
end
```

(`vendor/rails/activemodel/lib/active_model/type/value.rb:114-116`). Ruby `!=`
on a Hash/Array is structural and order-insensitive, so reassigning an
equal-but-reordered hash to a `json` column is NOT a change.

trails ports it as identity comparison —
`packages/activerecord/src/type/value.ts` is `oldValue !== newValue`
(`packages/activemodel/src/type/value.ts:77`) — so any structural value
(json, hstore, array, serialized) reads as changed on reassignment of an equal
value. `ActiveRecord::Type::Serialized` already carries a private Ruby-`==`
analogue (`packages/activerecord/src/type/serialized.ts`, `valuesEqual` /
`collectionsEqual`) that is exactly the missing semantics, duplicated at one
call site instead of living in the base predicate.

The sibling half — `Json#changed_in_place?` — was converged in that PR
(`vendor/rails/activerecord/lib/active_record/type/json.rb`:
`deserialize(raw_old_value) != new_value`).

## Acceptance criteria

- [ ] `ActiveModel::Type::Value#changed?` compares with Ruby `==` semantics, not
      JS identity, so structurally equal Hash/Array values are not "changed".
- [ ] The Ruby-`==` analogue lives in one place; `Type::Serialized`'s private
      copy is retired onto it rather than a third copy being added.
- [ ] Un-skip `test_changes_in_place_ignores_key_order` in
      `packages/activerecord/src/cases/json-shared-test-cases.ts` and delete the
      SKIP comment.
