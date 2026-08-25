---
title: "scorer-getter-and-arrow-resolution"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: 5791
claim: "2026-08-01T03:03:46Z"
assignee: "scorer-getter-and-arrow-resolution"
blocked-by: null
closed-reason: null
---

## Context

The scorer's port resolver (scripts/prism-codegen/score.ts indexPortFile)
sees function declarations, method declarations, and mixin-map indirection
(FinderMethods = { findBy: performFindBy }) — but not ports expressed as
object-literal getters/setters or const arrow assignments
(export const foo = (...) => ...), which inflates the missing bucket
(79 rows, 27 already recovered by the cross-file index in PR #5727).
Extend indexPortFile to index GetAccessor/SetAccessor declarations and
arrow-function variable initializers, with the same arity discipline as
resolvePortFn.

## Acceptance criteria

- Getter/setter and const-arrow ports resolve; missing count drops.
- Tests cover both shapes plus an arity-guarded collision.
- No change to matched/divergent semantics for already-resolved defs.
