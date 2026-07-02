---
title: "Phase 3: convert bespoke defineSchema -> create_table in PG adapter tests (9 files)"
status: claimed
updated: 2026-07-02
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: ["create-table-canonical-schema-loader"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-07-02T23:21:50Z"
assignee: "convert-bespoke-defineschema-pg-adapters"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 3 (depends on phase 1 loader) — PostgreSQL adapter bespoke conversions.

These files call `defineSchema(adapter, { ...bespoke tables })` to create their
own non-canonical tables. Convert each to real `connection.createTable(name,
opts, t => ...)` in the test/`beforeEach`, with a matching drop in teardown,
mirroring the specific Rails test's `create_table`/`drop_table`. Read the
corresponding Rails test FIRST and match it (fidelity above all else). Canonical
tables ride the boot-laid schema — only genuinely bespoke tables get `create_table`.

Files in scope:

- `adapters/postgresql/array.test.ts`
- `adapters/postgresql/datatype.test.ts`
- `adapters/postgresql/explain.test.ts`
- `adapters/postgresql/infinity.test.ts`
- `adapters/postgresql/json.test.ts`
- `adapters/postgresql/range.test.ts`
- `adapters/postgresql/schema.test.ts`
- `adapters/postgresql/uuid.test.ts`
- `adapters/postgresql/virtual-column.test.ts`

## Acceptance criteria

- Every bespoke `defineSchema(...)` in the listed files replaced by
  `connection.createTable(...)` + teardown drop, faithful to the Rails source.
- `git grep -c "defineSchema(" <these files>` -> 0.
- One PR per file (<=500 LOC each); file follow-up stories if the area needs
  multiple PRs — do NOT stack.
- No test renames; `test:compare` delta >= 0.
