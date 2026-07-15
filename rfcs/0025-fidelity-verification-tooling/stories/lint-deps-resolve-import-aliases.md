---
title: "lint-deps reports aliased imports as missing, making the arel to activemodel section false"
status: draft
updated: 2026-07-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4882.

`scripts/api-compare/lint-deps.ts` matches referenced types by **identifier
name**, so an aliased import hides the Rails type name from it. Aliasing is the
established convention in `packages/arel` for activemodel's `Attribute`, because
arel has its own `Attribute` to disambiguate from:

- `nodes/homogeneous-in.ts:3` — `import { Attribute as AMAttribute, ValueType } from "@blazetrails/activemodel"` (predates PR #4882)
- `nodes/casted.ts`, `visitors/to-sql.ts` — `import { Attribute as ModelAttribute } from "@blazetrails/activemodel"` (added by PR #4882)

Result: the arel to activemodel section reports **4/4 methods as ref
mismatches** even though every one references activemodel's `Attribute`
correctly:

```text
Dependency Lint -- arel -> activemodel
  4/4 methods use activemodel (100%)
  4 ref mismatches (uses activemodel but different types):
    != procForBinds -- missing Attribute, Type  (nodes/homogeneous-in.ts)
    != visitArelNodesValuesList -- missing Attribute  (visitors/to-sql.ts)
    != visitArelNodesAssignment -- missing Attribute  (visitors/to-sql.ts)
    != buildQuoted -- missing Attribute  (nodes/casted.ts)
```

`procForBinds` predates PR #4882, so this is not a regression — the signal is
simply false for every aliased import, which makes the section unusable as a
gate. It exits 0 (advisory), so nothing reds today; the cost is that a genuinely
missing dependency here is indistinguishable from alias noise, and a reviewer
checking `lint-deps` output has to hand-verify each line.

RFC 0044's `extractor-resolve-call-dispatch-and-import-aliases` (done) taught the
_call_ extractor to resolve import aliases; `lint-deps` was not covered by it.

## Acceptance criteria

- [ ] `lint-deps.ts` resolves an import alias back to the imported binding's
      original exported name before matching, so `Attribute as ModelAttribute`
      counts as a reference to `Attribute`.
- [ ] The four arel to activemodel entries above stop reporting
      "missing Attribute", with no import changed to satisfy the linter.
- [ ] No new false negatives: a method that genuinely omits a type Rails
      references still reports.
- [ ] Record whether the section becomes a gate (non-zero exit) once the noise is
      gone, or stays advisory — and why.
