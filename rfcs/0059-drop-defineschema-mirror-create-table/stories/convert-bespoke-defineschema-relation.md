---
title: "Phase 3: convert bespoke defineSchema -> create_table in relation tests (8 files)"
status: done
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: ["create-table-canonical-schema-loader"]
deps-rfc: []
est-loc: 250
priority: null
pr: 4452
claim: "2026-07-02T23:33:50Z"
assignee: "convert-bespoke-defineschema-relation"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 3 (depends on phase 1 loader) — relation bespoke conversions.

These files call `defineSchema(adapter, { ...bespoke tables })` to create their
own non-canonical tables. Convert each to real `connection.createTable(name,
opts, t => ...)` in the test/`beforeEach`, with a matching drop in teardown,
mirroring the specific Rails test's `create_table`/`drop_table`. Read the
corresponding Rails test FIRST and match it (fidelity above all else). Canonical
tables ride the boot-laid schema — only genuinely bespoke tables get `create_table`.

Files in scope:

- `relation/arel-ast-convergence.test.ts`
- `relation/build-joins-from-subquery-dedup.test.ts`
- `relation/eager-shared-alias-tracker.test.ts`
- `relation/field-ordered-values.test.ts`
- `relation/order.test.ts`
- `relation/select.test.ts`
- `relation/with.test.ts`
- `relation.trails.test.ts`

## Acceptance criteria

- Every bespoke `defineSchema(...)` in the listed files replaced by
  `connection.createTable(...)` + teardown drop, faithful to the Rails source.
- `git grep -c "defineSchema(" <these files>` -> 0.
- One PR per file (<=500 LOC each); file follow-up stories if the area needs
  multiple PRs — do NOT stack.
- No test renames; `test:compare` delta >= 0.
