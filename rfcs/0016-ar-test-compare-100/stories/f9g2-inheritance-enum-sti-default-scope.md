---
title: "F-9g2 follow-up — enum-backed STI inheritance column dispatch"
status: claimed
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: "2026-06-13T11:01:43Z"
assignee: "f9g2-inheritance-enum-sti-default-scope"
blocked-by: null
---

## Context

Split out of f9g2-attributes-and-loading (PR #3155 review). Rails matches
`SelectedMembership.count(:all) == 1` (`activerecord/test/cases/inheritance_test.rb:500-501`)
where `Membership.enum :type` (`activerecord/test/models/membership.rb:3-4`)
backs an _integer_ STI column (`activerecord/test/schema/schema.rb:783-787`).
STI must filter `WHERE type = <enum int for SelectedMembership>`. The canonical
trails `Membership` model declares the enum but does not wire STI dispatch on
the enum-backed column, so `SelectedMembership.count()` returns all rows (6),
not 1. Enum-backed STI inheritance-column dispatch is the real gap.

Skipped matched test in `packages/activerecord/src/inheritance.test.ts`:

- "inheritance with default scope"

## Acceptance criteria

- [ ] Enum-backed STI inheritance-column dispatch so STI subclass queries filter
      by the enum integer; the test un-skipped and passing using the canonical
      Membership/SelectedMembership models + memberships fixtures. ≤500 LOC.
