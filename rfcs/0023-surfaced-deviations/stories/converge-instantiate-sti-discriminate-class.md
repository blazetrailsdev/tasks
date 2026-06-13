---
title: "Converge instantiateSti onto discriminateClassForRecord (single STI dispatch path)"
status: draft
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3180 (f9g2-inheritance-enum-sti-default-scope). Rails has a
single STI dispatch path: `instantiate` (persistence.rb:100-102) →
`discriminate_class_for_record` → `find_sti_class`. trails has **two parallel
implementations** in `packages/activerecord/src/inheritance.ts`:

- `discriminateClassForRecord` — faithful to Rails, but gated by
  `usingSingleTableInheritance` which requires the inheritance column to be a
  **declared attribute** (`_attributeDefinitions.has(inheritCol)`).
- `instantiateSti` (called from `Base._instantiate`) — does its own
  present-check + `castInheritanceColumnValue` + `findStiClass`, _without_ the
  declared-attribute gate.

PR #3180 tried to converge the two (route `instantiateSti` through
`discriminateClassForRecord`) but had to revert: `Parrot`'s custom inheritance
column `parrot_sti_class` is a real DB column that is **not** a declared
`attribute()`, so the `usingSingleTableInheritance` gate returned false and
those rows silently hydrated as the base `Parrot` (CI failure across all three
adapters). The two paths therefore diverge on the declared-attribute
requirement, and `instantiateSti` remains a port-only duplicate.

Rails' `using_single_table_inheritance?` uses `_has_attribute?(inheritance_column)`,
which is true for any real column — so the trails divergence is that
`_attributeDefinitions.has(...)` is narrower than Rails' `_has_attribute?`. The
real fix is likely to align the gate with Rails (recognise schema columns that
aren't explicitly declared attributes), then collapse `instantiateSti` into
`discriminateClassForRecord` so there is one Rails-faithful dispatch path.

## Acceptance criteria

- [ ] `instantiateSti` and `discriminateClassForRecord` converge to a single
      dispatch path corresponding to Rails' `instantiate` →
      `discriminate_class_for_record` → `find_sti_class`.
- [ ] Custom non-declared STI columns (e.g. `Parrot#parrot_sti_class`) still
      dispatch correctly — the `using_single_table_inheritance?` gate matches
      Rails' `_has_attribute?` semantics (real columns, not only declared
      attributes).
- [ ] Enum-backed STI (Membership) and present-but-invalid → `SubclassNotFound`
      behaviour preserved; `inheritance.test.ts` + `use-fixtures.test.ts` pass
      unchanged. ≤500 LOC.
