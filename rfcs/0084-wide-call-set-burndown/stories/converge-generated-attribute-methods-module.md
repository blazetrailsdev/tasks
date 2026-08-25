---
title: "converge-generated-attribute-methods-module"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6389
claim: "2026-08-12T00:06:01Z"
assignee: "converge-generated-attribute-methods-module"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::AttributeMethods::ClassMethods#generated_attribute_methods`
(vendor/rails/activemodel/lib/active_model/attribute_methods.rb:400-402):

```ruby
def generated_attribute_methods
  @generated_attribute_methods ||= Module.new.tap { |mod| include mod }
end
```

The module is BUILT and INCLUDED lazily on first read. trails
(`packages/activemodel/src/attribute-methods.ts:467-469`) is
`return this._generatedMethods` — no construction, no include; the module is
created elsewhere, so the Rails laziness and the include-on-create invariant
have no counterpart at this name.

Surfaced by `audit-constructor-idiom-cluster-reasons` (RFC 0084): the row was
carrying a "constructor idiom — the construction is present in the port" reason
that is false; the construction really is absent from this body.

Converging needs the module-mixin idiom (`include()` / `Included<>` from
`@blazetrailsdev/activesupport`, or the `this`-typed-function shape) rather
than a plain object, since Rails' `include mod` is what makes the generated
methods overridable by the class body.

## Acceptance criteria

- `generatedAttributeMethods` memoizes a freshly-constructed module and
  includes it, at the Rails name, matching attribute_methods.rb:400-402.
- Whatever creates `_generatedMethods` today is converged onto this method or
  removed, so there is one creation site as in Rails.
- The `generated_attribute_methods` row (both the `new` and `include` calls) is
  DELETED from
  `scripts/api-compare/call-mismatches-exclude/activemodel/attribute-methods.json`
  by hand (only-shrink, `serializeBaseline`).
- Verified against `vendor/rails/activemodel/test/cases/attribute_methods_test.rb`.
