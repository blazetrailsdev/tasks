---
title: "Phase 2: delete canonical defineSchema(TEST_SCHEMA) calls (~25 files)"
status: in-progress
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: ["create-table-canonical-schema-loader"]
deps-rfc: []
est-loc: 200
priority: null
pr: 4455
claim: "2026-07-03T00:09:51Z"
assignee: "delete-canonical-defineschema-calls"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 2 (depends on phase 1 loader).

Once phase 1 lays the canonical schema at boot via `create_table`, the ~25 test
files whose only `defineSchema` calls pass the canonical schema
(`defineSchema(TEST_SCHEMA)` or the name-array form) are redundant no-ops — the
tables already exist. Delete those calls; the models ride the ambient canonical
tables (exactly how one-schema mode already treated them).

Get the current list with:
`git grep -l "defineSchema(TEST_SCHEMA\|defineSchema(\[" -- packages/activerecord/src` .

## Acceptance criteria

- All canonical `defineSchema(TEST_SCHEMA)` / name-array calls removed; the files
  rely on the boot-laid schema.
- No test renames; `test:compare` delta >= 0. If a file turns out to need a
  bespoke table, it belongs in a phase-3 conversion story, not here.
- Split into multiple PRs if >500 LOC; file follow-ups per the epic rule, do not stack.
