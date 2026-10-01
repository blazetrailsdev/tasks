---
title: "Error.generate_message guards the base reads Rails makes unguarded"
status: draft
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
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
closed-reason: null
---

## Context

Surfaced in trails#8335, which converged `generate_message`'s `respond_to?(:i18n_scope)` onto
`rbObjRespondTo` and left the rest of the body alone.

Rails' `ActiveModel::Error.generate_message`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:64-73`) reads the base unguarded:

```ruby
type = options.delete(:message) if options[:message].is_a?(Symbol)
value = (attribute != :base ? base.read_attribute_for_validation(attribute) : nil)

options = {
  model: base.model_name.human,
  attribute: base.class.human_attribute_name(attribute, { base: base }),
  value: value,
  object: base
}.merge!(options)
```

trails' `Error.generateMessage` (`packages/activemodel/src/error.ts`) guards every one of those
reads, each an arm Rails does not have:

- `value` is `"readAttributeForValidation" in base ? base.readAttributeForValidation(attribute) :
base[attribute]`, also gated on `base != null`. Rails sends `read_attribute_for_validation`.
- `model` is `baseClass?.modelName?.human?.()`. Rails reads `base.model_name.human` (the
  instance's `model_name`, not the class's).
- `attribute` is `baseClass?.humanAttributeName ? baseClass.humanAttributeName(…) :
humanize(attribute)`. Rails calls `human_attribute_name` unconditionally.
- `baseClass.lookupAncestors!()` and `klass.modelName!` carry non-null assertions over a
  hand-written `ModelClass` interface whose every member is optional.

`error-full-message-unguarded-respond-to-and-human-attribute-name` (RFC 0156) is the same finding
for `full_message` (`error.rb:15-63`); this is its `generate_message` twin and should land with or
after it so the two bodies agree.

## Converged shape

`generateMessage` reads `base.readAttributeForValidation(attribute)`, `base.modelName.human()` and
`base.constructor.humanAttributeName(attribute, { base })` unconditionally. The `ModelClass`
interface's members stop being optional. Tests that pass a bare object or a class without
`humanAttributeName` are converged onto Rails-shaped models, as `error_test.rb`'s `Person` /
`Manager` are.

## Acceptance criteria

- [ ] No `in` test, optional chain or `humanize` fallback remains in `generateMessage`.
- [ ] `ModelClass` (or the type that replaces it) declares the members Rails calls as required.
- [ ] The activemodel error tests keep their Rails names and stay green; `pnpm parity:api:calls`
      and `pnpm parity:api:arms:report --package=activemodel` do not regress.
