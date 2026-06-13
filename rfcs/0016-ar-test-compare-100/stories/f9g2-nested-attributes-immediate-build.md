---
title: "F-9g2 follow-up — Rails-style immediate in-memory nested-attribute build"
status: done
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 3193
claim: "2026-06-13T13:35:14Z"
assignee: "f9g2-nested-attributes-immediate-build"
blocked-by: null
---

## Context

Split out of f9g2-attributes-and-loading (PR pending). Rails builds nested
association records in memory at assign time (`part.ship.name` readable right
after `new`). trails' `accepts_nested_attributes_for` defers building to save
(`_pendingNestedAttributes` in nested-attributes.ts), so the in-memory
association stays empty.

Skipped matched tests in `packages/activerecord/src/forbidden-attributes-protection.test.ts`:

- "strong params style objects work with singular associations"
- "strong params style objects work with collection associations"

## Acceptance criteria

- [ ] Nested attributes build associated records in memory at assign time; both
      tests un-skipped and passing. ≤500 LOC.
