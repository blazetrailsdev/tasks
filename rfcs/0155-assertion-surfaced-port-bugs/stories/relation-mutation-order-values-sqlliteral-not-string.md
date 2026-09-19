---
title: "relation-mutation-order-values-sqlliteral-not-string"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
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

Parked test: `reverse_order!` in `packages/activerecord/src/relation/mutation.test.ts`, mirroring `vendor/rails/activerecord/test/cases/relation/mutation_test.rb:89-101`.

Rails asserts `relation.order_values.first == "title DESC"` because `Arel::Nodes::SqlLiteral` is a `String` subclass. In trails `orderValues` holds `SqlLiteral` objects (`{ value: "title DESC" }`), so `expect(rel.orderValues.at(0)).toEqual("title DESC")` fails. Cause not investigated beyond that; whether `SqlLiteral` should compare equal to a string is undecided.

## Acceptance criteria

The `reverse_order!` test is un-skipped and passes with the direct string comparisons.
