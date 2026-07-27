---
title: "Cast the STI type value through base_class on the new/attributes path"
status: ready
updated: 2026-07-27
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
closed-reason: null
---

## Context

Surfaced while converging `instantiateSti` into `_instantiate` (#5379, RFC 0072).

Rails' `find_sti_class` (`vendor/rails/activerecord/lib/active_record/inheritance.rb:311-320`)
splits two concerns that trails currently conflates:

```ruby
def find_sti_class(type_name)
  type_name = base_class.type_for_attribute(inheritance_column).cast(type_name)
  subclass = sti_class_for(type_name)
  unless subclass == self || descendants.include?(subclass)
    raise SubclassNotFound, ...
```

The **cast** goes through `base_class`; the **lookup and its subclass check** use
the receiver (`self`).

PR #5379 fixed this on the row path only — `discriminateClassForRecord`
(`packages/activerecord/src/inheritance.ts`) now casts via
`baseClass.call(modelClass)`. It was fixed there because that PR changed the
discrimination receiver from `base_class` to `this`, which made the divergence
reachable.

The same divergence remains on the `new` path.
`castStiValueFromAttrs` (`packages/activerecord/src/inheritance.ts`, shared by
`subclassFromAttributes` and `subclassFromAttributesForNew`) passes `modelClass`
to `castInheritanceColumnValue` rather than the STI base. Rails reaches this via
`subclass_from_attributes` calling `find_sti_class`, so the same `base_class`
cast rule applies.

Observable when a subclass overrides the inheritance column's attribute type:
`Subclass.new({ type: ... })` casts the type value through the subclass's
override instead of the hierarchy's own type.

## Acceptance criteria

- `castStiValueFromAttrs` casts through `base_class` (as
  `discriminateClassForRecord` now does), leaving subclass lookup and the
  `subclass == self || descendants.include?` check on the receiver.
- Confirm no other `castInheritanceColumnValue` call site still passes a
  non-base receiver.
- Decide and record whether this rule is testable under the canonical-models-only
  rule. Exercising it needs a subclass that overrides the inheritance column's
  attribute type; no canonical Rails test model does this, and Rails itself has
  no test for it. If no canonical model supports it, say so in the PR and rely
  on the call-site justification rather than adding a bespoke STI model. This
  question is open from #5379, where the row-path fix shipped untested for
  exactly this reason.
