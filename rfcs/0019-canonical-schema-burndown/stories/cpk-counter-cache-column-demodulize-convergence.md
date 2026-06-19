---
title: "cpk-counter-cache-column-demodulize-convergence"
status: done
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: 3607
claim: "2026-06-18T22:23:07Z"
assignee: "cpk-counter-cache-column-demodulize-convergence"
blocked-by: null
---

## Context

Surfaced while converting `AssociationsTest > loading cpk association when
persisted and in memory differ` to canonical `CpkOrder`/`CpkBook` in RFC 0019
wave 7 (PR #3573). Porting the test onto the canonical CPK models fails with
`no such column: "cpk_books_count"`.

`resolveCounterColumn` (packages/activerecord/src/associations.ts:563) derives a
boolean `counterCache: true` column as `${pluralize(underscore(childModel.name))}_count`.
For the canonical `CpkBook` class (flat name, no Ruby namespace) this yields
`cpk_books_count`. Rails demodulizes `Cpk::Book` → `Book` →
`active_record.name.demodulize.underscore.pluralize` = `books_count`, which is the
column actually present in the canonical `cpk_orders` schema
(test-schema.ts: `cpk_orders.books_count`) and in Rails schema.rb:287.

Because trails class names are flat (`CpkBook` not `Cpk::Book`), the trails
derivation cannot demodulize away a namespace and over-includes the `cpk_` prefix.

## Acceptance criteria

- [ ] `resolveCounterColumn` derives `books_count` (not `cpk_books_count`) for
      `CpkBook`'s `belongs_to :order, counter_cache: true`, matching Rails'
      demodulized default.
- [ ] Convert `AssociationsTest > loading cpk association when persisted and in
memory differ` onto canonical `CpkOrder`/`CpkBook` + fixtures (remove
      `cpk_orders`/`cpk_order_items` scratch tables from the first describe's
      defineSchema) and move it to the canonical describe.
- [ ] No regression in counter-cache.test.ts; test:compare delta non-negative.
