---
title: "converge-autosave-one-schema"
status: draft
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

> **SUPERSEDED (RFC 0048 re-spec, 2026-06-30).** Folded into `converge-persistence-validations-one-schema`.
> Do not work this story — it overlapped a parent cluster story and was a
> shallow-rename framing. Kept as draft for history.

## Context

Split off from `converge-persistence-validations-one-schema` (RFC 0048). PR #4317
converged `validations.test.ts`; this story covers `autosave.test.ts`, which still
declares a bespoke `defineSchema(TEST_SCHEMA)` (see top of file, ~line 18) with
non-canonical tables/columns. One-schema mode (no per-test DROP) needs it on
canonical `TEST_SCHEMA` tables.

## Acceptance criteria

- Convert `packages/activerecord/src/autosave.test.ts` to canonical `TEST_SCHEMA`
  tables/columns + official fixtures/models; no bespoke tables, no invented columns.
  Match Rails table/column names exactly.
- Passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Test names match Rails verbatim. Single PR from main, <500 LOC.
