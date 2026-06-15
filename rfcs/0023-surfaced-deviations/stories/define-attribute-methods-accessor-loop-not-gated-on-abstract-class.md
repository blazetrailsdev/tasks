---
title: "defineAttributeMethods accessor-generation loop runs unconditionally; Rails wraps it in unless abstract_class?"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `define_attribute_methods`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:105-123`)
gates the schema-load + accessor generation behind `unless abstract_class?`:

```ruby
superclass.define_attribute_methods unless base_class?
unless abstract_class?
  load_schema
  super(attribute_names)
  alias_attribute :id_value, :id if _has_attribute?("id")
end
generate_alias_attributes
```

An abstract class (`self.abstract_class = true`) has no table, so it must **not**
load schema or generate per-attribute accessors — only the superclass cascade
and `generate_alias_attributes` run for it.

trails' `defineAttributeMethods`
(`packages/activerecord/src/attribute-methods.ts:268`) performs the superclass
cascade (`:283-291`, mirroring `superclass.define_attribute_methods unless
base_class?`) but then runs the **accessor-generation loop unconditionally** —
there is no `unless abstract_class?` guard around the `this.prototype`
getter/setter installation (`:292+`). An abstract class with declared
attributes (or one that reflects columns) therefore gets accessors generated
where Rails generates none, which can mask/shadow a concrete subclass's
intended behavior and diverges from Rails' abstract-class contract.

(Companion to `define-attribute-methods-id-value-alias-and-superclass-cascade`,
which added the cascade + `id_value` alias; this is the remaining
`unless abstract_class?` gate around the generation body.)

## Acceptance criteria

- [ ] The schema-load + accessor-generation body of `defineAttributeMethods` is
      gated on "not abstract" (mirror `unless abstract_class?`,
      `attribute_methods.rb:113`); the superclass cascade and the
      alias-attributes generation still run for abstract classes.
- [ ] An abstract class (`abstract_class = true`) does not get per-attribute
      accessors installed on its prototype; a concrete subclass still does.
- [ ] Read the Rails `attribute_methods`/`abstract_class` test covering this and
      mirror its name verbatim; add a regression test.
- [ ] api:compare / test:compare delta non-negative.
