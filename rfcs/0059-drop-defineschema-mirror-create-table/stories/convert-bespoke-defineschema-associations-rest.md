---
title: "Phase 3: convert bespoke defineSchema -> create_table in associations (rest, 10 files)"
status: in-progress
updated: 2026-07-02
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: ["create-table-canonical-schema-loader"]
deps-rfc: []
est-loc: 350
priority: null
pr: 4447
claim: "2026-07-02T22:33:51Z"
assignee: "convert-bespoke-defineschema-associations-rest"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 3 (depends on phase 1 loader) — associations (rest) bespoke conversions.

These files call `defineSchema(adapter, { ...bespoke tables })` to create their
own non-canonical tables. Convert each to real `connection.createTable(name,
opts, t => ...)` in the test/`beforeEach`, with a matching drop in teardown,
mirroring the specific Rails test's `create_table`/`drop_table`. Read the
corresponding Rails test FIRST and match it (fidelity above all else). Canonical
tables ride the boot-laid schema — only genuinely bespoke tables get `create_table`.

Files in scope:

- `associations/callbacks.test.ts`
- `associations/collection-proxy-count.test.ts`
- `associations/eager-load-includes-full-sti-class.test.ts`
- `associations/eager-load-nested-include.test.ts`
- `associations/extension.test.ts`
- `associations/has-many-associations.test.ts`
- `associations/inverse-associations.test.ts`
- `associations/reload-owner-repoint.test.ts`
- `associations/sti-owner-through-foreign-key.test.ts`
- `habtm-destroy-order.test.ts`

## Acceptance criteria

- Every bespoke `defineSchema(...)` in the listed files replaced by
  `connection.createTable(...)` + teardown drop, faithful to the Rails source.
- `git grep -c "defineSchema(" <these files>` -> 0.
- One PR per file (<=500 LOC each); file follow-up stories if the area needs
  multiple PRs — do NOT stack.
- No test renames; `test:compare` delta >= 0.
