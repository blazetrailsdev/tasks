---
title: "contact-test-model-extends-model-where-rails-is-a-plain-class"
status: draft
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
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

`vendor/rails/activemodel/test/models/contact.rb:3-8` is a **plain class**:

```ruby
class Contact
  extend ActiveModel::Naming
  include ActiveModel::Conversion
  include ActiveModel::Validations
  include ActiveModel::Serializers::JSON
```

`packages/activemodel/src/test-helpers/models/contact.ts` instead does
`class Contact extends Model`, so it runs `Model`'s constructor and with it
`init_internals`, which seats `_errors` and `_contextForValidation` as own
properties. Ruby's `Contact` has neither, and `Contact#attributes` is
`instance_values.except("address", "friends", "contact")`
(`contact.rb:36`) — so the two extra seats show up as serialized attributes.

PR #7577 worked around this with a `MODEL_BASE_IVARS` filter inside contact.ts'
local `instanceValues` helper, so `Contact#attributes` yields the Ruby ivar set.
That is a deviation in a test helper standing in for the composition trails
cannot yet spell.

The blocker for the faithful shape is that `errors` lives on `Model`
(`model.ts`), not on `Validations`. Rails puts it on the concern —
`activemodel/lib/active_model/validations.rb:328-330`:

```ruby
def errors
  @errors ||= Errors.new(self)
end
```

so `include ActiveModel::Validations` alone is enough for Ruby's `Contact`.
Move it to `validations.ts`' `InstanceMethods` (verify `include()` carries an
accessor off an object literal — see the `extend()`-carries-accessors note) and
the plain-class Contact composes: `extend(this, Naming)`,
`include(this, Conversion)` + `extend(this, ConversionClassMethods)`,
`include(this, Validations)`, `include(this, SerializersJSON)`, plus the
`initialize(options = {})` from `contact.rb:22-24`.

## Acceptance criteria

- [ ] `errors` is defined by `Validations`, at the Rails call site, not only by
      `Model`.
- [ ] `test-helpers/models/contact.ts` is a plain class composing the four
      Rails modules, with `contact.rb`'s own `initialize`.
- [ ] The `MODEL_BASE_IVARS` filter is gone and `instanceValues` is the bare
      ivar reading again.
- [ ] `conversion.test.ts` and `serializers/json-serialization.test.ts` keep
      their names and pass; `parity:test` activemodel percent does not drop.
