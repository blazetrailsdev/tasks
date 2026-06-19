---
title: "assoc-preloadertest-delegated-type-already-loaded"
status: done
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3665
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up of `associations-test-preloadertest-canonical` (RFC 0019). The
`PreloaderTest` test `some already loaded associations` in
`packages/activerecord/src/associations.test.ts` maps by name to Rails
`test_some_already_loaded_associations`
(`vendor/rails/activerecord/test/cases/associations_test.rb:1008`), which
exercises a `delegated_type` graph: `Invoice has_many :line_items` /
`has_many :shipping_lines`, each with `has_many :discount_applications`
(a delegated_type) whose `discount` is preloaded via a nested
`Preloader.new(records: [invoice], associations: [line_items: {...}, shipping_lines: {...}])`,
asserting a 5-query count then no-query reads, including the partial
already-loaded reload path.

The current trails body is a simplified `Post`/`author` `includes` smoke test —
it does NOT exercise the delegated_type / nested-preload / query-count
behaviour the Rails test guards. Porting faithfully requires the canonical
`Invoice`/`LineItem`/`ShippingLine`/`*DiscountApplication`/`Discount`
delegated_type models and their tables.

- trails: `packages/activerecord/src/associations.test.ts` (`some already loaded associations`)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb:1008`

## Acceptance criteria

- [ ] Port `some already loaded associations` onto canonical delegated_type
      models (Invoice/LineItem/ShippingLine/DiscountApplication/Discount),
      mirroring the Rails nested-preload + query-count + no-query assertions.
- [ ] Test name matches Rails verbatim. test:compare delta non-negative.
- [ ] PR <=500 LOC. No node:_/process._; async fs only.
