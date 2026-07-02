---
title: "Phase 3: convert bespoke defineSchema -> create_table in core/persistence/locking tests (23 files)"
status: in-progress
updated: 2026-07-02
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: ["create-table-canonical-schema-loader"]
deps-rfc: []
est-loc: 450
priority: null
pr: 4448
claim: "2026-07-02T22:45:54Z"
assignee: "convert-bespoke-defineschema-core-persistence"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 3 (depends on phase 1 loader) — core / persistence / locking bespoke conversions.

These files call `defineSchema(adapter, { ...bespoke tables })` to create their
own non-canonical tables. Convert each to real `connection.createTable(name,
opts, t => ...)` in the test/`beforeEach`, with a matching drop in teardown,
mirroring the specific Rails test's `create_table`/`drop_table`. Read the
corresponding Rails test FIRST and match it (fidelity above all else). Canonical
tables ride the boot-laid schema — only genuinely bespoke tables get `create_table`.

Files in scope:

- `bind-parameter.test.ts`
- `custom-locking.test.ts`
- `date.test.ts`
- `delegate.test.ts`
- `delegated-type.test.ts`
- `dirty.test.ts`
- `finder.test.ts`
- `inheritance-namespaced.test.ts`
- `lazy-schema-reflection.test.ts`
- `locking.test.ts`
- `log-subscriber.test.ts`
- `mixin.test.ts`
- `nested-attributes-with-callbacks.test.ts`
- `persistence.test.ts`
- `persistence/reload-association-cache.test.ts`
- `primary-keys.test.ts`
- `statement-cache.test.ts`
- `table-metadata.test.ts`
- `token-for.test.ts`
- `transaction-instrumentation.test.ts`
- `transactions.trails.test.ts`
- `unsafe-raw-sql.test.ts`
- `view.test.ts`

## Acceptance criteria

- Every bespoke `defineSchema(...)` in the listed files replaced by
  `connection.createTable(...)` + teardown drop, faithful to the Rails source.
- `git grep -c "defineSchema(" <these files>` -> 0.
- One PR per file (<=500 LOC each); file follow-up stories if the area needs
  multiple PRs — do NOT stack.
- No test renames; `test:compare` delta >= 0.
