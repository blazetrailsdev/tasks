---
title: "Consolidate duplicate CPK test-model definitions (cpk.ts vs cpk/) with divergent primary keys"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 50
pr: null
claim: "2026-06-18T22:03:09Z"
assignee: "consolidate-duplicate-cpk-test-models"
blocked-by: null
---

## Context

Two parallel definitions of the canonical CPK test models exist and both
register under the same registry names:

- `packages/activerecord/src/test-helpers/models/cpk.ts` — `CpkBook` with
  `_primaryKey = ["author_id", "id"]` (Rails-faithful: vendor/rails/activerecord/
  test/models/cpk/book.rb is `Cpk::Book` with `query_constraints :author_id, :id`).
- `packages/activerecord/src/test-helpers/models/cpk/book.ts` — a _different_
  `CpkBook` with `_primaryKey = "id"` (single key), plus `cpk/order.ts` with its
  own `CpkOrder`.

Because both classes are named `CpkBook`/`CpkOrder`, `registerModel` keys them
identically — so association resolution and `new CpkBook(...)` behave
differently depending on which module a test imported, and the two can collide
in a shared process. PR #3588 hit this: `new CpkOrder({ id: [1, 123] })` /
`new CpkBook({ id: [1, 123] })` only produced the Rails `"1_123"` / `"1;123"`
to_param when imported from `cpk.ts`; `cpk/book.ts`'s single-`id` CpkBook does
not match Rails.

## Acceptance criteria

- [ ] One canonical definition per CPK model (`CpkOrder`, `CpkBook`, …), with
      primary keys matching the Rails `Cpk::*` models exactly.
- [ ] Remove the divergent/duplicate definitions; update all importers to the
      single canonical module.
- [ ] No two AR test models register under the same name with different shapes.

## Definition of done

A single canonical CPK model module; `cpk.ts` and `cpk/` no longer define
competing same-named classes, and the surviving primary keys are Rails-faithful.
