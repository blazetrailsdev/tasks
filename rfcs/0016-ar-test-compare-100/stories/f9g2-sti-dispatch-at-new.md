---
title: "F-9g2 follow-up — STI dispatch at new() from type column"
status: in-progress
updated: 2026-06-13
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: 3195
claim: "2026-06-13T14:39:19Z"
assignee: "f9g2-sti-dispatch-at-new"
blocked-by: null
---

## Context

Split out of f9g2-attributes-and-loading (PR pending). `new Company({ type: "Client" })`
must return a `Client` instance (STI dispatch from the inheritance column at
construction). `subclassFromAttributes` (inheritance.ts) exists but isn't
invoked from the Base constructor; wiring it is currently unsafe because the
global STI registry resolves bare class names ambiguously across test files.

Skipped matched test in `packages/activerecord/src/forbidden-attributes-protection.test.ts`:

- "permitted attributes can be used for sti inheritance column"

## Acceptance criteria

- [ ] Registry-safe STI-at-new wiring; the test un-skipped and passing. ≤500 LOC.
