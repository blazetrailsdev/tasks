---
title: "converge-where-composed-of-aggregate-expansion"
status: in-progress
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4431
claim: "2026-07-02T18:33:51Z"
assignee: "converge-where-composed-of-aggregate-expansion"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by faithful-port-finder-exists-cluster. `Customer.exists?(address:
existing_address)` where `address` is a `composed_of` aggregate throws
`can't cast [object Object] to a SQLite3 type` — the where/exists hash handler
does not expand a composed_of aggregate value into its underlying column
mappings. Rails sanitizes `address: Address(...)` into the three mapped columns
(address_street/address_city/address_country) before building the predicate
(see AggregateReflection / PredicateBuilder aggregate expansion).

These finder_test.rb ports are `it.skip`'d in finder.test.ts pending this fix:

- exists with aggregate having three mappings
- exists with aggregate having three mappings with one difference

## Acceptance criteria

- [ ] where/exists hash expands composed_of aggregate values into their column
      mappings, matching Rails.
- [ ] Un-skip the two tests above; they pass.
