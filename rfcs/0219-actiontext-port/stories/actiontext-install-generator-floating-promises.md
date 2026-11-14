---
title: "Clear actiontext's three no-floating-promises findings in the install generators"
status: ready
updated: 2026-11-14
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CI's "Promise finding counts" gate (actiontext mark 0, `no-floating-promises`) measures 3 findings on main, so every PR touching actiontext goes red there (seen on trails#10056). They came in with #10039 after #10035 armed the rule repo-wide:

- `packages/actiontext/lib/generators/action-text/install/install-generator.ts:9`
- `packages/actiontext/lib/trails/generators/test-unit/install/install-generator.ts:8`
- `packages/actiontext/test/generators/action-text/install/install-generator.trails.test.ts:9`

The first two are `this.methodAdded(...)` calls in a `static {}` block (packages/trailties/CLAUDE.md, "Thor commands register through an explicit methodAdded").

## Acceptance criteria

- Each finding is handled the way a sibling package at mark 0 handles `methodAdded` in a static block, with no new floating promise.
- The promise-count gate is green for actiontext at mark 0.
