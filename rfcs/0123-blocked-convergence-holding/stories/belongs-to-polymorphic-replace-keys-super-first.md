---
title: "Port BelongsToPolymorphicAssociation#replace_keys line-for-line (super first, polymorphic_name, owner[]=)"
status: draft
updated: 2026-09-29
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8251 made `BelongsToAssociation#replaceKeys` a line-for-line port of
`replace_keys` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/belongs_to_association.rb:131-149`).
The polymorphic override in
`packages/activerecord/src/associations/belongs-to-polymorphic-association.ts`
(`replaceKeys`) still diverges from
`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/belongs_to_polymorphic_association.rb:25-33`:

```ruby
def replace_keys(record, force: false)
  super

  target_type = record ? record.class.polymorphic_name : nil

  if force || owner._read_attribute(reflection.foreign_type) != target_type
    owner[reflection.foreign_type] = target_type
  end
end
```

- trails writes the type column BEFORE calling `super`; Rails calls `super`
  first.
- trails reads the type through `this.polymorphicTypeName(record)`; Rails is
  `record.class.polymorphic_name`.
- trails compares with `!==` and duck-types `_readAttribute` / `_writeAttribute`
  on the owner; Rails is `!=` (`rbEqual`), `owner._read_attribute`, and
  `owner[]=` (`owner.set`, pinned in
  `scripts/api-compare/operator-order-spelling.ts:173`).

## Acceptance criteria

- `BelongsToPolymorphicAssociation#replaceKeys` calls `super.replaceKeys(record, { force })`
  first, then computes `targetType` from
  `(record.constructor as typeof Base).polymorphicName()` (with a
  `@missingRailsName class — PERMANENT` receipt as in the base method), and
  writes via `this.owner.set(this.reflection.foreignType, targetType)` guarded
  by `force || !rbEqual(this.owner._readAttribute(foreignType), targetType)`.
- No `typeof … === "function"` owner duck-typing remains in the method.
- belongs-to / polymorphic association tests stay green.
