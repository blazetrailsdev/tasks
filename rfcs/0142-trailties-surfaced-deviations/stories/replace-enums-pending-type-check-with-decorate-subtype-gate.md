---
title: "Replace _enumsPendingTypeCheck/assertEnumTypeDeclared with Rails' decorate-block subtype gate"
status: closed
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by trails#6793 (3476294766): origin/main packages/activerecord/src/enum.ts:237-243 raises 'Undeclared attribute type for enum' inside the decorateAttributes block on 'subtype === defaultValue()' (enum.rb:239-248). git grep '_enumsPendingTypeCheck|assertEnumTypeDeclared' over packages/activerecord/src on origin/main (4c5755a0af) returns nothing. Duplicate of closed converge-undeclared-enum-type-raise-to-materialization."
---

## Context

Rails' `_enum` raises "Undeclared attribute type for enum" from inside the
`decorate_attributes` block, on one condition — the decorated subtype is
`ActiveModel::Type.default_value`
(vendor/rails/activerecord/lib/active_record/enum.rb:239-248):

```ruby
decorate_attributes([name]) do |_name, subtype|
  if subtype == ActiveModel::Type.default_value
    raise "Undeclared attribute type for enum '#{name}' in #{self.name}. ..."
  end
```

trails cannot use that condition today (its alias-aware column seeding hands
an aliased attribute the _target_ column's type at replay), so
`packages/activerecord/src/enum.ts` carries an invented substitute:
`_enumsPendingTypeCheck` (a per-class Set of names queued at declaration,
copy-on-write inherited), `assertEnumTypeDeclared` (an alias-unaware
`columnForAttribute` probe that clears the marker), the `explicitlyTyped`
probe over `_attributeDefinitions`, and extra `assertEnumTypeDeclared` call
sites in `enumTypeOf` and `base.ts` `typeForAttribute`. None of it exists in
Rails. PR #6480 moved the marker into `installEnumAttribute` and keyed it off
the resolved name, but did not remove it.

## Converged shape

The decorator block's `subtype === Type.defaultValue()` check is the only
gate, with the column seeding fixed so an un-backed name really does arrive
with the default value type. `_enumsPendingTypeCheck`,
`assertEnumTypeDeclared`, and its call sites in `enumTypeOf` / `base.ts`
delete.

## Acceptance criteria

- [ ] Enum type declaration is gated solely by the decorate-block subtype
      check (enum.rb:239-248).
- [ ] `_enumsPendingTypeCheck` and `assertEnumTypeDeclared` are gone.
- [ ] Both existing orderings stay green: `alias_attribute` before `enum`
      works; `enum` before `alias_attribute` raises on first use.
- [ ] No baseline row added or widened.
