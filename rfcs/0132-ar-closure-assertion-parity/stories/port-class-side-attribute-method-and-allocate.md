---
title: "port-class-side-attribute-method-and-allocate"
status: draft
updated: 2026-09-15
rfc: "0132-ar-closure-assertion-parity"
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

Two class-side members `attribute_methods_test.rb` exercises have no trails
port, so the matching tests cannot mirror their Rails assertions:

- `ActiveRecord::AttributeMethods::ClassMethods#attribute_method?`
  (`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:224`),
  `super || (table_exists? && column_names.include?(attribute.to_s.delete_suffix("=")))`.
  `attribute_methods_test.rb:1269-1273` is three assertions over it; trails has
  only the _instance_ `isAttributeMethod`
  (`packages/activerecord/src/attribute-methods.ts:449`), so the port asserts
  `attributeNames()` instead.
- `Class#allocate`, used by `Persistence#becomes`
  (`vendor/rails/activerecord/lib/active_record/persistence.rb:488`) and
  asserted directly by `attribute_methods_test.rb:234-237`
  (`assert_equal "#<Topic not initialized>", topic.inspect`). trails lists
  `"allocate"` only as a dangerous-attribute name
  (`packages/activerecord/src/attribute-methods.ts:156`).

Surfaced while porting the assertions in
`packages/activerecord/src/attribute-methods.test.ts` under RFC 0132; both
tests carry a call-site note pointing here.

## Acceptance criteria

- Class-side `isAttributeMethod` is ported at the Rails control flow, and
  `attribute_methods_test.rb`'s `attribute_method?` mirrors its three
  assertions (`truthy`, `truthy`, `falsy`).
- `allocated objects can be inspected` mirrors Rails' single `assert_equal`, or
  the story is blocked with the specific reason `allocate` cannot be ported.
- `pnpm parity:test -- --package activerecord --assertions` does not regress.
