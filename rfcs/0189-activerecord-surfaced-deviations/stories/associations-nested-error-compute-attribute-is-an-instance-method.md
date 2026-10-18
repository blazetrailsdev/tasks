---
title: "activerecord: Associations::NestedError#compute_attribute is an instance method with no stand-in receiver or underscore"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Operator triage 2026-10-18 (RFC 0189 refine): all parity axes at 100%; this is structural/shape fidelity with no user-observable behavior change — not worth pursuing. Closed as won't-fix."
---

## Context

From trails PR 8873. `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/nested_error.rb:8-25`:

    def initialize(association, inner_error)
      @base = association.owner
      @association = association
      @inner_error = inner_error
      super(@base, inner_error, { attribute: compute_attribute(inner_error) })
    end

    def compute_attribute(inner_error)
      association_name = association.reflection.name
      ...
      "#{association_name}.#{inner_error.attribute}".to_sym

`packages/activerecord/src/associations/nested-error.ts` ports `compute_attribute` as a private
**static** `computeAttribute(association, innerError)` that builds a stand-in receiver with
`Object.assign(Object.create(NestedError.prototype), …)` so `index_errors_setting` and `index` have
a `this` before `super()` runs. It also reads `underscore(association.reflection.name)`, a call
Rails does not make. `index_errors_setting`, `index` and `ordered_records` are free functions
called with `.call(self)`.

## Acceptance criteria

- [ ] `computeAttribute` is an instance method with Rails' one parameter, with no `Object.create`
      stand-in; if `this` before `super()` forces a shape, it is receipted at the declaration.
- [ ] `association.reflection.name` is read as Rails reads it, with no `underscore`, or the reason
      the name needs converting is fixed at its source.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` stay green.
