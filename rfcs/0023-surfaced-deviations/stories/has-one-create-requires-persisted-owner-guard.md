---
title: "has-one-create-requires-persisted-owner-guard"
status: done
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4101
claim: "2026-06-25T04:22:34Z"
assignee: "has-one-create-requires-persisted-owner-guard"
blocked-by: null
---

## Context

Surfaced during review of PR #3942 (singular-create-set-new-record-after-save).

Rails' `HasOneAssociation#_create_record`
(vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:133-138)
guards the parent before delegating to `super`:

```ruby
def _create_record(attributes, raise_error = false, &block)
  unless owner.persisted?
    raise ActiveRecord::RecordNotSaved.new("You cannot call create unless the parent is saved", owner)
  end
  super
end
```

trails' `HasOneAssociation` inherits the base
`SingularAssociation#_createRecord`
(packages/activerecord/src/associations/singular-association.ts) and does NOT
override `_createRecord`, so it lacks this guard. Calling
`owner.createHasOne(...)` / `owner.create<Assoc>(...)` on an unpersisted owner
does not raise `RecordNotSaved("You cannot call create unless the parent is
saved")` as Rails does.

Pre-existing deviation, not introduced by #3942 — flagged adjacent during that
review.

## Acceptance criteria

- [ ] `HasOneAssociation` overrides `_createRecord` to raise `RecordNotSaved`
      with message "You cannot call create unless the parent is saved" when the
      owner is not persisted, then delegates to the base implementation —
      matching Rails has_one_association.rb:133-138.
- [ ] belongs_to create paths are unaffected (no such guard in Rails for
      belongs_to).
- [ ] Add/port the corresponding Rails test (test name verbatim) exercising
      create on an unpersisted has_one owner.
- [ ] No api:compare / test:compare regression.
