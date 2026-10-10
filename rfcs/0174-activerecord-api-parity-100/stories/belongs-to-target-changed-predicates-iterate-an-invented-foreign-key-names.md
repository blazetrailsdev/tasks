---
title: "BelongsToAssociation's target_changed? predicates iterate an invented foreignKeyNames instead of one call with reflection.foreign_key"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8477 review. `BelongsToAssociation`'s three change predicates
(`packages/activerecord/src/associations/belongs-to-association.ts:110-127`) iterate a
`foreignKeyNames()` helper (`:174-177`) with `.some(...)`. Rails makes one call each with
`reflection.foreign_key`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/belongs_to_association.rb:82-92`):

```ruby
def target_changed?
  owner.attribute_changed?(reflection.foreign_key) || (!foreign_key_present? && target&.new_record?)
end

def target_previously_changed?
  owner.attribute_previously_changed?(reflection.foreign_key)
end

def saved_change_to_target?
  owner.saved_change_to_attribute?(reflection.foreign_key)
end
```

`foreign_key_names` does not exist in `belongs_to_association.rb`; the helper also invents a
`"#{name}_id"` fallback for a nil `reflection.foreignKey()`. The loop collapses Rails' value-returning
`||` into a boolean, so `isTargetPreviouslyChanged` / `isSavedChangeToTarget` cannot answer `nil`.

## Acceptance criteria

- [ ] Each predicate is one call on `this.owner` with `this.reflection.foreignKey()`, as `:82-92`.
- [ ] `foreignKeyNames` is deleted, or its other callers are shown to mirror a Rails method.
- [ ] If a composite `foreign_key` (an Array) needs the dirty predicates to accept an Array, that is
      ported where Rails handles it, not in this association.
- [ ] `belongs-to-associations.test.ts` and the composite-key association tests pass on all adapters.
