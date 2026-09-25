---
title: "create_or_find_by: relation transaction, no invented RecordNotSaved arm"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8103
claim: "2026-09-25T19:20:45Z"
assignee: "trails-actions-insert-at-marker-instead-of-rails-sentinel"
blocked-by: null
closed-reason: null
---

## Context

Rails' `create_or_find_by` / `create_or_find_by!`
(`activerecord/lib/active_record/relation.rb:258-280`) are

```ruby
with_connection do |connection|
  transaction(requires_new: true) { create(attributes, &block) }
rescue ActiveRecord::RecordNotUnique
  ...
end
```

`packages/activerecord/src/relation.ts` `createOrFindBy` / `createOrFindByBang`
differ in two ways:

- They call `this._model.transaction(...)`. Rails calls the relation's
  `transaction`, which delegates to the model.
- They add an arm Rails does not have: when the transaction returns `undefined`
  (rolled back), they throw
  `RecordNotSaved("….createOrFindBy rolled back before persist")`.

## Acceptance criteria

- Both bodies call `this.transaction(...)` if the relation delegates it, and
  return the block's result as Rails does, with no `RecordNotSaved` arm.
- Existing `relations.test.ts` create-or-find tests stay green.
