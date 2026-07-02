---
title: "Phase 3: convert bespoke defineSchema -> create_table in test-helpers tests (6 files)"
status: ready
updated: 2026-07-02
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: ["create-table-canonical-schema-loader"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 3 (depends on phase 1 loader) — test-helpers bespoke conversions.

These files call `defineSchema(adapter, { ...bespoke tables })` to create their
own non-canonical tables. Convert each to real `connection.createTable(name,
opts, t => ...)` in the test/`beforeEach`, with a matching drop in teardown,
mirroring the specific Rails test's `create_table`/`drop_table`. Read the
corresponding Rails test FIRST and match it (fidelity above all else). Canonical
tables ride the boot-laid schema — only genuinely bespoke tables get `create_table`.

Files in scope:

- `test-helpers/with-transactional-fixtures.test.ts`
- `test-helpers/use-fixtures.test.ts`
- `test-helpers/handler-resolved-adapter.test.ts`
- `test-helpers/naked-fixtures.test.ts`
- `test-helpers/repair-validations.test.ts`
- `test-helpers/use-transactional-tests.test.ts`

Note: `test-helpers/define-schema.test.ts` (which tests `defineSchema` itself) is NOT converted — it is DELETED in phase 4 when `defineSchema` is removed. Exclude it from this story.

## Acceptance criteria

- Every bespoke `defineSchema(...)` in the listed files replaced by
  `connection.createTable(...)` + teardown drop, faithful to the Rails source.
- `git grep -c "defineSchema(" <these files>` -> 0.
- One PR per file (<=500 LOC each); file follow-up stories if the area needs
  multiple PRs — do NOT stack.
- No test renames; `test:compare` delta >= 0.
