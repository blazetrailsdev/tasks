---
title: "Camel-case AR's snake_case declaration names"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["activerecord"]
deps: ["naming-shape-merge-base-gate"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The audit found two src declarations with snake_case names: `packages/activerecord/src/relation/predicate-builder/association-query-value.ts:101` `id_value` and `test-fixtures.ts:272` `connection_name`. Object keys are data and out of scope.

## Acceptance criteria

- [ ] Both are camelCase, or shown to be data shapes and labelled so.
- [ ] AR `snake` count is 0.
