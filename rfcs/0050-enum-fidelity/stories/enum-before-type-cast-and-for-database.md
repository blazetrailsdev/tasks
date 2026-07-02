---
title: "enum *_before_type_cast / *_for_database accessors"
status: draft
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `enum.test.ts` to the canonical `Book` model (RFC 0050,
PR #4410 enum-canonical-book-gaps). Rails exposes `status_before_type_cast`
(raw stored integer), `status_for_database` (serialized integer), and
`attributes_for_database` for enum columns
(`vendor/rails/activerecord/test/cases/enum_test.rb`). trails does not surface
these for enums, so three cases are `it.skip`-ped in
`packages/activerecord/src/enum.test.ts` ("attribute_before_type_cast",
"attribute_for_database", "attributes_for_database").

## Acceptance criteria

- [ ] Enum columns expose `{name}BeforeTypeCast` / `{name}ForDatabase` and
      participate in `attributesForDatabase`, returning the serialized integer
      per Rails.
- [ ] Un-skip the three `enum.test.ts` cases (drop `it.skip` → `it`).
