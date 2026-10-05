---
title: "activemodel: Attribute dumps @_value / @_has_value where Rails dumps @value; LazyAttributeHash.marshalLoad is a static"
status: draft
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `marshal-cannot-round-trip-rational-or-date`, which made
`attributes with proc defaults can be marshalled`
(`vendor/rails/v8.0.2/activemodel/test/cases/attributes_test.rb:136-143`) pass. The dump it writes
still differs from Rails' in two places, neither of which that test reads:

- `Attribute`'s ivars are spelled `_valueBeforeTypeCast`, `_value` and `_hasValue`
  (`packages/activemodel/src/attribute.ts:31-36`), so a `TYPE_OBJECT` attribute is written with
  `@_value_before_type_cast` / `@_value` and an extra `@_has_value`, where Rails writes
  `@value_before_type_cast` and `@value` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:33-39`),
  and `defined?(@value)` (`attribute.rb:41,104,166`) is the presence of the ivar, not a flag.
  No `rbDeclareIvar` maps them.
- `LazyAttributeHash.marshalLoad` (`packages/activemodel/src/attribute-set/builder.ts:253`) is a
  `static` that answers a new object, where Rails' `marshal_load`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:157-159`) is an instance
  method assigning ivars. `Marshal.load` allocates the class and sends the instance `marshal_load`
  (`vendor/ruby/v3.3.11/marshal.c:2217-2233`), so a dumped `LazyAttributeHash` raises
  `TypeError: instance of ... needs to have method 'marshal_load'`. `UserProvidedDefault#marshalLoad`
  was converged the same way in the PR that closed `marshal-cannot-round-trip-rational-or-date`.

## Acceptance criteria

- [ ] `Marshal.dump` of an `Attribute` writes Rails' ivar names, byte-equal to MRI's for a
      `FromUser` attribute with and without a read value, and `Marshal.load` of MRI's bytes answers
      an attribute whose `hasBeenRead()` matches `defined?(@value)`.
- [ ] `LazyAttributeHash#marshalLoad` is an instance method with Rails' body
      (`attribute_set/builder.rb:157-159`), and a `LazyAttributeHash` round-trips through
      `Marshal.load(Marshal.dump(...))`.
