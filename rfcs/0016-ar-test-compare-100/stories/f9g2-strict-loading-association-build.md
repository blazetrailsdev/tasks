---
title: "F-9g2 follow-up — strict-loading ignored on new-record association build/writer"
status: in-progress
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 3196
claim: "2026-06-13T14:47:16Z"
assignee: "f9g2-strict-loading-association-build"
blocked-by: null
---

## Context

Split out of f9g2-attributes-and-loading (PR pending). Strict-loading must be
_ignored_ when building/writing brand-new (unpersisted) association records,
and ignored for records loaded from fixtures. The violation check is wired into
the lazy-load path but not the association build/writer path.

Skipped matched tests in `packages/activerecord/src/strict-loading.test.ts`:

- "strict loading with new record on build is ignored"
- "strict loading with new record on writer is ignored"
- "strict loading with has one through does not prevent creation of association"
- "strict loading violations are ignored on fixtures"

## Acceptance criteria

- [ ] All four tests un-skipped and passing; strict-loading not triggered on
      new-record association build/writer. ≤500 LOC.
