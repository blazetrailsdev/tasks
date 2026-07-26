---
title: "arel HomogeneousIn#procForBinds references ValueType where Rails references ActiveModel::Type, leaving one lint-deps mismatch"
status: draft
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `lint-deps-resolve-import-aliases` (PR #5241). After
import-alias resolution, the `arel -> activemodel` dependency-lint section is
clean except for one genuine ref mismatch:

```text
Dependency Lint -- arel -> activemodel
  4/4 methods use activemodel (100%)
  1 ref mismatches (uses activemodel but different types):
    != procForBinds -- missing Type  (nodes/homogeneous-in.ts)
```

Rails' `Arel::Nodes::HomogeneousIn#proc_for_binds` references
`ActiveModel::Type.default_value` — the extracted dep ref is `Type`. The trails
port (`packages/arel/src/nodes/homogeneous-in.ts:3,8-9,85`) reaches the same
default via `new ValueType()` from `@blazetrails/activemodel`, so lint-deps
records the ref as `ValueType` and reports `Type` as missing. This is a genuine
naming divergence, not alias noise, so it is (correctly) still reported after
PR #5241 — but it means the section cannot reach zero mismatches.

Rails source: `activerecord/lib/arel/nodes/homogeneous_in.rb` (proc_for_binds)
and `activemodel/lib/active_model/type.rb`.

## Options

1. Reconcile the port export name: is `ValueType` the intended trails name for
   `ActiveModel::Type` (the module/registry) vs `ActiveModel::Type::Value` (the
   base type class)? If the Rails ref `Type` corresponds to a differently-named
   trails export, decide whether to align the name.
2. If the divergence is intentional (distinct concepts), teach lint-deps a small
   known-name-mapping (Rails `Type` -> trails `ValueType`) analogous to the
   existing `RUBY_METHOD_REFS` / `RUBY_MIXIN_REFS` normalization tables in
   `scripts/api-compare/lint-deps.ts`, so the benign divergence stops reporting.

## Acceptance criteria

- [ ] Decide (1) rename/reconcile vs (2) normalization-table entry, with the
      Rails `file:line` justification recorded at the call site or table.
- [ ] `arel -> activemodel` lint-deps section reports 0 ref mismatches (or the
      remaining entry is documented as a deliberate, justified divergence).
- [ ] No new false negatives introduced elsewhere.
