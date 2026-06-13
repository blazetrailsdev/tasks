---
title: "F-9g2 follow-up — of_first_firm join-scope inheritance fixtures"
status: claimed
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 60
priority: 20
pr: null
claim: "2026-06-13T11:07:15Z"
assignee: "f9g2-inheritance-of-first-firm-scope"
blocked-by: null
---

## Context

Split out of f9g2-attributes-and-loading (PR pending). Rails' `of_first_firm`
scope is `joins(account: :firm).where("companies.id": 1)`. Exercising it needs
the companies↔accounts association graph (Account `belongs_to :firm`
class_name "Company"; Company `has_one :account` foreign_key "firm_id") plus an
`accounts` fixture table.

Skipped matched test in `packages/activerecord/src/inheritance.test.ts`:

- "scope inherited properly"

## Acceptance criteria

- [ ] Company/Client STI with the `of_first_firm` join-scope + accounts fixtures;
      the test un-skipped and passing. ≤500 LOC.
