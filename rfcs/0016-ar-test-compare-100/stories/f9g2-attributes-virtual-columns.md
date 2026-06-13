---
title: "F-9g2 follow-up — virtual attributes (no DB column)"
status: ready
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of f9g2-attributes-and-loading (PR pending). Virtual attributes —
declared via `attribute()` with no backing DB column — must be excluded from
INSERT/UPDATE and return their default on read (incl. on records loaded from
the DB). Today persistence emits the phantom column and the INSERT fails
(`table X has no column named …`).

Skipped matched tests in `packages/activerecord/src/attributes.test.ts`:

- "model with nonexistent attribute with default value can be saved"
- "attributes not backed by database columns return the default on models loaded from database"

## Acceptance criteria

- [ ] Both tests un-skipped and passing; persistence filters attributes to
      actual table columns. ≤500 LOC.
