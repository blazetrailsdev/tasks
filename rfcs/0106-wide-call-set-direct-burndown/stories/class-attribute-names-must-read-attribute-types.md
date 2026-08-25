---
title: "class attribute_names must read attribute_types, not columnNames + _attributeDefinitions"
status: done
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6789
claim: "2026-08-20T20:05:07Z"
assignee: "class-attribute-names-must-read-attribute-types"
blocked-by: null
closed-reason: null
---

## Context

Rails' class-level `attribute_names`
(`activerecord/lib/active_record/attribute_methods.rb:236-242`) is:

```ruby
@attribute_names ||= if !abstract_class? && table_exists?
  attribute_types.keys
else
  []
end.freeze
```

trails' `classAttributeNames`
(`packages/activerecord/src/attribute-methods.ts`) instead walks
`columnNames()` first and appends the non-column entries of
`_attributeDefinitions`, with its own revision-stamped memo.

The difference is observable, not cosmetic. `attribute_types` resolves the
pending attribute decorations; `_attributeDefinitions` + `columnNames()` does
not. So the point at which a decorator's error surfaces moves: a typeless enum
raises from `decorate_attributes` (`enum.rb:240-245`) at `attribute_names` in
Rails, but in trails only later, at whatever first forces `attributeTypes()`.
PR #6779 hit exactly this — after that PR the raise arrives via
`_has_attribute?("id")` (`:117`, `:260-262`) rather than via `attribute_names`,
and `enum.trails.test.ts`'s "castEnumValue raises for an enum with no column and
no explicit type" had to drop a `loadSchema()` pre-warm as a result.

The ordering within `attribute_types.keys` also differs: trails orders by schema
column position then declaration order, with a comment claiming Rails' order;
`attribute_types` is `_default_attributes`' key order.

## Converged shape

`classAttributeNames` returns `attributeTypes()` keys, gated on
`!abstract_class? && table_exists?` as Rails gates it. The `table_exists?` half
stays trails' schema-cache-derived answer (documented inherent deviation: Rails
makes a sync DB hit trails cannot), but the body it guards becomes
`Object.keys(this.attributeTypes())`.

Check `attributes_test.rb` "overloading properties does not attribute method
order" before landing — the current hand-rolled ordering exists to satisfy it,
so the port has to show `_default_attributes` already produces that order rather
than assuming it.

## Acceptance criteria

- [ ] `classAttributeNames` reads `attributeTypes()`, mirroring attribute_methods.rb:236-242.
- [ ] The declared/column interleaving and its bespoke ordering comment are gone.
- [ ] `attributes_test.rb`'s attribute-method-order coverage still passes.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows.
