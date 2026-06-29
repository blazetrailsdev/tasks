---
title: "attribute-optional-type-preserve-existing"
status: done
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4262
claim: "2026-06-29T11:34:14Z"
assignee: "attribute-optional-type-preserve-existing"
blocked-by: null
---

## Context

Rails' `attribute(name, type = nil, **options)` makes the type optional
(`activemodel/lib/active_model/attribute_registration.rb:18`). When the type is
omitted, it pushes only a default/decorator modification and the attribute keeps
its existing (schema-reflected or previously-declared) type via the `PendingType`
`with_type` inheritance path (ibid, lines 55–63). This backs the Rails idiom
`attribute :col, default: "x"` — "change only the default, keep the type."

trails' `attribute()` requires a concrete type:
`packages/activemodel/src/attributes.ts` — `typeName: string | Type` is
mandatory, and it unconditionally `pushPendingType(this, name, type)`.

This surfaced while porting `attributes_test.rb` (PR #4199, story
attributes-test-cluster). Three tests exercise the no-type "keep existing type"
invariant in Rails but had to pass an explicit type in TS, exercising the
set-type path instead of the preserve-type path:

- `packages/activerecord/src/attributes.test.ts` "attributes with overridden
  types keep their type when a default value is configured separately"
- "attributes not backed by database columns keep their type when a default value
  is configured separately"
- "overloaded default but keeping its own type"

## Acceptance criteria

- [ ] `attribute(name, options)` (type omitted) is supported: it preserves the
      existing attribute type and only applies the default (PendingDefault), with
      no PendingType push — matching Rails `attribute_registration.rb:18,55-63`.
- [ ] The three tests above are rewritten to the no-type form
      (`this.attribute("overloaded_float", { default: "123" })` analogue) and
      still pass, removing the explicit-type deviation notes.
- [ ] No regression in api:compare data-layer parity or test:compare.
