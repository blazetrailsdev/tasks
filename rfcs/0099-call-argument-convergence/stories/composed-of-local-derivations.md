---
title: "composed-of-local-derivations"
status: ready
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
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

Surfaced while converging the `composed_of` -> `Reflection.create` argument row
(`args-dl-genuine-shape-residue`). `aggregations.rb:225-245`:

```ruby
def composed_of(part_id, options = {})
  options.assert_valid_keys(:class_name, :mapping, :allow_nil, :constructor, :converter)
  unless self < Aggregations
    include Aggregations
  end

  name        = part_id.id2name
  class_name  = options[:class_name]  || name.camelize
  mapping     = options[:mapping]     || [ name, name ]
  mapping     = [ mapping ] unless mapping.first.is_a?(Array)
  allow_nil   = options[:allow_nil]   || false
  constructor = options[:constructor] || :new
  converter   = options[:converter]

  reader_method(name, class_name, mapping, allow_nil, constructor)
  writer_method(name, class_name, mapping, allow_nil, converter)
  ...
end
```

`packages/activerecord/src/aggregations.ts` `composedOf` ports none of the six
local derivations. It has no `assert_valid_keys` call, no `class_name`
defaulting from `name.camelize`, no `mapping` defaulting or single-pair
normalization, and no `allow_nil`/`constructor` defaults — the caller's
`ComposedOfOptions` is read directly at each use.

The consequence with real behaviour behind it is `allow_nil`. Rails'
`reader_method` (`aggregations.rb:248-258`) takes it as argument 4 and gates on
`@aggregation_cache[name].nil? && (!allow_nil || mapping.any? { |key, _|
!read_attribute(key).nil? })` — with `allow_nil: false` that condition is
always true, so the value object is built even when every mapped attribute is
nil. trails' `readerMethod` (aggregations.ts:86-92) has no `allowNil`
parameter at all and unconditionally returns `null` when every mapped
attribute is nil, which is Rails' `allow_nil: true` arm applied to both.

Its argument list also diverges: Rails passes
`(name, class_name, mapping, allow_nil, constructor)`; trails passes
`(modelClass, partId, mapping, className, constructorFn)` — reordered, missing
`allowNil`, and `className` is the value-object CLASS where Rails passes the
class-name String. `writerMethod` has the same reordering.

## Acceptance criteria

- `composedOf` derives `name`, `className`, `mapping`, `allowNil`,
  `constructor` and `converter` as locals, with Rails' defaults and Rails'
  `mapping.first.is_a?(Array)` normalization, and calls `assertValidKeys`.
- `readerMethod` / `writerMethod` take Rails' parameters in Rails' order,
  `allowNil` included, and `readerMethod` ports the
  `!allow_nil || mapping.any? { … }` guard.
- A test covering `allow_nil: false` with every mapped attribute nil — the arm
  that currently answers `null` where Rails builds the object. Rails' coverage
  is `vendor/rails/activerecord/test/cases/aggregations_test.rb`; port the
  matching case under its Rails name.
