---
title: "Rename define-schema.ts to its residual schema-type role and scrub stale defineSchema comments"
status: in-progress
updated: 2026-07-05
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 0
pr: 4613
claim: "2026-07-05T14:22:27Z"
assignee: "rename-define-schema-residual-vocabulary"
blocked-by: null
closed-reason: null
---

## Context

Follow-up deferred from `delete-defineschema-function-and-test` (PR #4587). That
story deleted the `defineSchema` function, `DefineSchemaOpts`,
`seedSchemaSignatures`, and the entire now-dead per-adapter signature cache from
`packages/activerecord/src/test-helpers/define-schema.ts`. The file now holds
ONLY the residual schema-type vocabulary consumed by `canonical-schema.ts` and
~130 `TEST_SCHEMA` importers: the `ColumnSpec`/`Schema`/`IndexSpec` type family,
`COLUMN_TYPE_MAP_{PG,MYSQL,SQLITE}`, `serialIdType`, `supportsExpressionIndex`,
`columnsOf`, `isWrappedSchema`.

Two loose ends the deletion PR intentionally left (rename was "consider…as a
single mechanical rename" — out of scope for a terminal-deletion PR):

1. **File is misnamed.** `define-schema.ts` no longer defines any schema — it is
   pure schema-type vocabulary. Either rename it (e.g. `schema-types.ts`) as a
   single mechanical rename updating the ~14 importers, or fold its remaining
   exports into `canonical-schema.ts`.
2. **Stale comment references.** ~30 files still mention `defineSchema` in prose
   comments / one test name that references the deleted concept
   (`git grep -l '\bdefineSchema\b' packages/activerecord/src` minus the
   schema-dumper generated-API sites in `schema-dumper.ts` /
   `schema-file-generator.ts` / `tasks/database-tasks.ts`, which are a separate
   product API and must stay). Scrub the prose refs to describe the current
   canonical-schema surface. Do NOT rename the `use-fixtures.test.ts` test whose
   name contains "defineSchema" (test-rename rule).

## Acceptance criteria

- `define-schema.ts` renamed to reflect its residual role (or its exports folded
  into `canonical-schema.ts`); all importers updated; single mechanical rename.
- Stale `defineSchema` prose comments in `packages/activerecord/src` refreshed to
  the current surface; schema-dumper generated-API sites untouched; no test
  names changed.
- `test:compare` delta >= 0.
