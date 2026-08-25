---
title: "blocks-conditionals-rescue-images"
status: done
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - codegen-golden-output-snapshots
deps-rfc: []
est-loc: 250
priority: 9
pr: 6113
claim: "2026-08-05T02:15:00Z"
assignee: "converge-mysql-version-string-single-raise-site"
blocked-by: null
closed-reason: null
---

## Context

Toward 100% node coverage. Control/blocks bucket (~15 sites): LambdaNode →
arrow function (same shape as blockToArrow in
scripts/prism-codegen/handlers/expressions.ts); expression-position
IfNode/UnlessNode with multi-statement branches → IIFE arrow with block
body (currently requires single-expression branches, control.ts); chained
`rescue A; rescue B` → single catch with caseEq dispatch (control.ts
BeginNode declines on rescue.subsequent); MultiWriteNode with a TRAILING
splat rest → `[a, ...b] = x` (valid JS; only mid-splat is unrepresentable
and stays declined).

## Acceptance criteria

- Lambda, multi-statement conditional expressions, chained rescues, and
  trailing-splat destructuring emit; their census markers reach zero.
- Mid-splat multi-assign still declines (documented).
- 0 parse errors invariant holds; tests per construct.
