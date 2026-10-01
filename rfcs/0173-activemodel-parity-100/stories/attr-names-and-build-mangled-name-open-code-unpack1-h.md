---
title: "AttrNames.define_attribute_accessor_method never const_sets the ATTR_ constant it yields"
status: draft
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced porting `AttrNames.define_attribute_accessor_method`'s `yield` arm
(`activemodel-converge-dropped-block-arms`, trails#8335).

Rails' `else` arm (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:577-589`):

```ruby
safe_name = attr_name.unpack1("h*")
const_name = "ATTR_#{safe_name}"
const_set(const_name, attr_name) unless const_defined?(const_name)
temp_method_name = "__temp__#{safe_name}#{'=' if writer}"
attr_name_expr = "::ActiveModel::AttributeMethods::AttrNames::#{const_name}"
yield temp_method_name, attr_name_expr
```

trails#8335 converged the `unpack1("h*")` half (ruby-compat's `unpack1` answers `h`, and both
`defineAttributeAccessorMethod` and `buildMangledName` call it). The `const_set` line is still
missing from `AttrNames.defineAttributeAccessorMethod`
(`packages/activemodel/src/attribute-methods.ts`): it yields an `attrNameExpr` naming a constant
that is never set.

Nothing observes the gap today. All four callers' blocks take only `tempMethodName`, because the
generated bodies close over the attribute name instead of `module_eval`ing source.

The blocker is the receiver. `AttrNames` is a TS `namespace`, and `rbModConstSet`
(`packages/ruby-compat/src/include.ts`) takes a `Module`, a class, or `{ readonly name: string }`
(TS2345 when handed `typeof AttrNames`). Rails' `AttrNames` is a plain `module`
(`attribute_methods.rb:560`). There is also no `const_defined?` port in ruby-compat.

## Acceptance criteria

- [ ] `AttrNames` is a receiver `rbModConstSet` accepts, with no cast at the call site.
- [ ] `defineAttributeAccessorMethod` sets `ATTR_<safe_name>` on `AttrNames` unless it is already
      defined, as `attribute_methods.rb:584` does, with a trails test reading the constant back.
