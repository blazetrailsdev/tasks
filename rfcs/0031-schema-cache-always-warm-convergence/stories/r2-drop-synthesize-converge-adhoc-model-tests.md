---
title: "R2: drop synthesize-from-attributes for table-backed models; converge ad-hoc-model tests"
status: draft
updated: 2026-06-16
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps:
  - r1-eager-persistent-schema-cache-test-harness
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC `0031-schema-cache-always-warm-convergence` phase R2 (deps: R1). With the
cache always warm (R1), the synthesize-`columnsHash`-from-`attribute()` fallback
in `packages/activerecord/src/model-schema.ts` (`loadSchema` / `columnsHash`) is
no longer needed for table-backed models and is a Rails divergence: Rails'
`columns` / `columns_hash` are purely DB-sourced (`model_schema.rb`), and
`attribute()` only overrides a column's type or adds a virtual attribute — it
never changes `column_names` membership.

The blocker (proven on PR #3445): tests define ad-hoc model classes on REAL
table names and rely on synthesize for non-Rails expectations —
`base.test.ts:2533/2664`, `calculations.test.ts:5283`,
`associations.test.ts:2738/2785`, `cache-key.test.ts:349` (and likely more).
Each must be converged to Rails fidelity, checked against its Rails counterpart.

## Scope

- Drop the synthesize-from-attributes branch for models that HAVE a backing
  table; keep it ONLY for genuinely tableless attribute-only models (enumerate
  them — RFC open question 2).
- Converge the divergent ad-hoc-model tests file-by-file to Rails behavior
  (`column_names` = real DB columns; `attribute()` overrides type / adds
  virtuals). Read the corresponding Rails test first; do NOT rename test names.

## Acceptance criteria

- [ ] Table-backed models' `columnNames()` / `columnsHash()` return DB-sourced
      columns only; a user `attribute()` that is not a real column does not
      appear in `column_names` (matches Rails `model_schema.rb`).
- [ ] Tableless attribute-only models still work via the retained synthesize
      path; the set of such models is documented.
- [ ] All previously-divergent tests are converged (not renamed) and green on
      SQLite canonical; PG/MySQL per gate.

## Hard rules

- NEVER rename/reword test names; fix implementation or test expectation to match
  Rails, with the Rails source cited.
- No `node:*` imports; NO `process.*`; async fs only.
