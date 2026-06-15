---
title: "define_attribute_methods omits alias_attribute :id_value, :id and the superclass.define_attribute_methods cascade"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `define_attribute_methods`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:105`) does
three things trails' `defineAttributeMethods`
(`packages/activerecord/src/attribute-methods.ts:268`) does not:

```ruby
def define_attribute_methods # :nodoc:
  return false if @attribute_methods_generated
  GeneratedAttributeMethods::LOCK.synchronize do
    return false if @attribute_methods_generated
    superclass.define_attribute_methods unless base_class?      # (1) cascade
    unless abstract_class?
      load_schema
      super(attribute_names)
      alias_attribute :id_value, :id if _has_attribute?("id")   # (2) id_value alias
    end
    generate_alias_attributes                                    # (3) also cascades
    @attribute_methods_generated = true
  end
  true
end
```

The trails port:

1. **No superclass cascade.** Rails calls `superclass.define_attribute_methods
unless base_class?` so a parent's methods exist before the subclass generates
   its own. trails generates only the current class (its own-flag check at
   `attribute-methods.ts:273` already accounts for inheritance, but never _drives_
   the parent's generation).
2. **No `alias_attribute :id_value, :id`.** Rails aliases `id_value` → `id` for
   any model with an `id` attribute (used internally, and observable: a model can
   call `record.id_value`). trails never installs this alias.
3. `generate_alias_attributes` (`attribute-methods.ts:351`) already exists but
   Rails also cascades it to the superclass (`generate_alias_attributes unless
superclass == Base`, `attribute_methods.rb:128`); confirm/parity that path too.

Low blast radius today (nothing in the suite asserts `id_value` and the own-flag
gate masks the missing cascade in most cases), but it is a real API/behavior gap
surfaced while auditing attribute-method generation.

## Acceptance criteria

- [ ] `defineAttributeMethods` drives `superclass.defineAttributeMethods()` for
      non-base classes before generating its own (guard against re-entry via the
      existing own-flag check so the cascade is still idempotent).
- [ ] For a model with an `id` attribute, an `id_value` alias resolves to `id`
      (mirror `alias_attribute :id_value, :id if _has_attribute?("id")`), routed
      through the existing `aliasAttribute` path so it composes with
      `generateAliasAttributes`.
- [ ] `generateAliasAttributes` cascades to the superclass like Rails (skip when
      `superclass === Base`).
- [ ] Read the corresponding Rails test(s) in `attribute_methods_test.rb` first
      (e.g. the `id_value` coverage) and mirror names verbatim; add a regression
      test for the alias and the cascade.
- [ ] api:compare / test:compare delta non-negative.
