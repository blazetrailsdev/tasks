---
title: "attr-names-and-build-mangled-name-open-code-unpack1-h"
status: draft
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
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

Surfaced porting `AttrNames.define_attribute_accessor_method`'s `yield` arm
(`activemodel-converge-dropped-block-arms`).

Rails mangles a name that cannot be `def`ined with `String#unpack1("h*")`, in two places:

- `ClassMethods#build_mangled_name`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:445-453`):
  `mangled_name = :"__temp__#{name.unpack1("h*")}"`.
- `AttrNames.define_attribute_accessor_method` (`attribute_methods.rb:577-589`), whose `else` arm is

  ```ruby
  safe_name = attr_name.unpack1("h*")
  const_name = "ATTR_#{safe_name}"
  const_set(const_name, attr_name) unless const_defined?(const_name)
  temp_method_name = "__temp__#{safe_name}#{'=' if writer}"
  attr_name_expr = "::ActiveModel::AttributeMethods::AttrNames::#{const_name}"
  yield temp_method_name, attr_name_expr
  ```

trails open-codes the hex in both bodies (`packages/activemodel/src/attribute-methods.ts`,
`AttrNames.defineAttributeAccessorMethod` and `ClassMethods.buildMangledName`):

```ts
Array.from(name)
  .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
  .join("");
```

That differs from `h*` twice over: `h` is LOW nibble first (`"a".unpack1("h*") # => "16"`,
trails yields `"61"`), and it walks UTF-16 code units where Ruby walks bytes. ruby-compat's
`unpack1` (`packages/ruby-compat/src/array.ts`) answers only `C`, `l`, `E` and `@`, returns
`number | null`, and raises `unknown_directive` for `h`.

`defineAttributeAccessorMethod` also drops `const_set(const_name, attr_name) unless
const_defined?(const_name)`: it yields `attrNameExpr` naming a constant that is never set. No
caller reads the expression (the generated bodies close over the name instead of `module_eval`ing
source), so nothing observes the gap today.

## Acceptance criteria

- [ ] ruby-compat's `unpack1` answers the `h` directive (`vendor/ruby/v3.3.11/pack.c`, the `'h'`
      case of `pack_unpack_internal`), with a trails test pinning `"a".unpack1("h*") == "16"` and a
      multi-byte name.
- [ ] `buildMangledName` and `AttrNames.defineAttributeAccessorMethod` call it where Rails calls
      `unpack1("h*")`; neither open-codes the hex.
- [ ] `defineAttributeAccessorMethod` sets `ATTR_<safe_name>` on `AttrNames` unless it is already
      defined, as `attribute_methods.rb:584` does.
