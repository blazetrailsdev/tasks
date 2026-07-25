---
title: "Relation#bind_attribute is missing the _reflect_on_association branch"
status: draft
updated: 2026-07-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0072 model-accessor sweep (PR #5322). The wide call-mismatch
gate flags `bind_attribute` for a missing `model` call, but it is not a
read-routing gap — trails is missing the behavior entirely.

Rails `vendor/rails/activerecord/lib/active_record/relation.rb:102-110`:

```ruby
def bind_attribute(name, value) # :nodoc:
  if reflection = model._reflect_on_association(name)
    name = reflection.foreign_key
    value = value.read_attribute(reflection.association_primary_key) unless value.nil?
  end

  attr = table[name]
  bind = predicate_builder.build_bind_attribute(attr.name, value)
  yield attr, bind
end
```

trails `packages/activerecord/src/relation.ts` `bindAttribute` goes straight to
`predicateBuilder.build(arelTable.get(column), value)` with no association
branch, so passing an association name (rather than its foreign key) binds
against a non-existent column instead of resolving to the FK and reading the
association primary key off the record.

Baseline entry carrying this finding:
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`,
`rubyName: bind_attribute`, `call: model`.

## Acceptance criteria

- `bindAttribute` resolves an association name through
  `model._reflectOnAssociation(name)` to the reflection's foreign key, and
  reads `reflection.associationPrimaryKey` off a non-null value, mirroring
  relation.rb:102-110.
- Test mirrors the Rails case verbatim (check
  `vendor/rails/activerecord/test/cases/` for the covering test before writing
  a new one).
- The `bind_attribute` / `model` wide-baseline entry is removed once the call
  is genuinely made.
