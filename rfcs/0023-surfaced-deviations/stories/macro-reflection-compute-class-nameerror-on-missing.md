---
title: "MacroReflection#computeClass should raise NameError for missing class (composed_of parity)"
status: in-progress
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 4538
claim: "2026-07-04T03:11:33Z"
assignee: "macro-reflection-compute-class-nameerror-on-missing"
blocked-by: null
---

## Context

Surfaced in PR #4306 (belongs-to-namespaced-class-convention-resolution-test).
`AssociationReflection#computeClass` was fixed to raise `NameError` for a
missing constant (matching Rails `compute_class`, reflection.rb:495-508), but
the sibling `MacroReflection#computeClass`
(`packages/activerecord/src/reflection.ts:665-674`) still throws a bare `Error`
for the missing-class case. `MacroReflection.computeClass` backs
`AggregateReflection` (`composed_of`), so a missing `composed_of` class type
raises a plain `Error` instead of Rails' `NameError`.

Rails resolves both association and aggregation reflection classes through the
same `compute_type` → `NameError`-on-missing path. Callers that rescue only
`NameError` (e.g. `Association#checkKlass`'s narrowed fallback) will not treat
the `MacroReflection` error path uniformly.

## Acceptance criteria

- `MacroReflection#computeClass` raises `NameError` (not bare `Error`) when the
  resolved constant is missing, mirroring `AssociationReflection#computeClass`
  and Rails `compute_class`.
- Existing `/not found in registry/` message assertions still pass.
- A `composed_of` with a non-existent class type raises `NameError`.
