---
title: "ruby-compat: port Module#remove_const as rbModRemoveConst; tests stop open-coding Reflect.deleteProperty"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Module#remove_const` is `rb_mod_remove_const` (`vendor/ruby/v3.3.11/variable.c:3302`), which raises `NameError` for an undefined constant (`undefined_constant`) and otherwise calls `rb_const_remove` (`variable.c:3313`): it deletes the entry from the module's constant table, raises `NameError` "cannot remove Mod::Name" when the module is frozen or the name is not a constant there, and returns the removed value.

ruby-compat now ports it: `rbModRemoveConst(mod, name)` (`packages/ruby-compat/src/variable.ts:106`, trails#8728). The call site below still open-codes it.

trails#8676 added one such site. Rails' "raises type mismatch with namespaced class" ends with

```ruby
Admin.send :remove_const, "Region" if Admin.const_defined?("Region")
Admin.send :remove_const, "RegionalUser" if Admin.const_defined?("RegionalUser")
```

(`vendor/rails/v8.0.2/activerecord/test/cases/associations/belongs_to_associations_test.rb:281-282`), and the port (`packages/activerecord/src/associations/belongs-to-associations.test.ts:614-615`) spells the removal `Reflect.deleteProperty(Admin, "Region")`. That works only because `rbModConstSet` defines the constant as a configurable own property. It skips the `NameError` arms and leaves the class's recorded path (`classpaths`) in place.

The same test also deletes four `modelRegistry` keys by hand (`:653-656`), because `registerModel` stores the class under both its short and its qualified name. That half belongs to `model-class-names-resolve-through-constantize-not-a-model-registry` and goes away with the registry.

## Acceptance criteria

- [ ] `belongs-to-associations.test.ts`'s "raises type mismatch with namespaced class" calls `rbModRemoveConst(Admin, "Region")` / `rbModRemoveConst(Admin, "RegionalUser")` under the same `rbModConstDefined` guards Rails has, and no longer calls `Reflect.deleteProperty`.
- [ ] Any other test or source site that open-codes a Rails `remove_const` as a `delete` / `Reflect.deleteProperty` on a module or class is moved onto it (grep `remove_const` in the matching Rails files first).
