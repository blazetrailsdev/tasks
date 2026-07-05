---
title: "delete-defineschema-function-and-test"
status: in-progress
updated: 2026-07-05
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps:
  - remove-usefixtures-public-surface
deps-rfc: []
est-loc: null
priority: 2
pr: 4587
claim: "2026-07-05T01:52:36Z"
assignee: "delete-defineschema-function-and-test"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). Terminal deletion, carved out
of `retire-defineschema-and-one-schema-apparatus` (which shipped the eslint-rule
tail). **Guiding principle: Rails fidelity above all else.** Runnable only once
`git grep -c defineSchema packages/activerecord/src` counts ZERO real
test-helper call-sites (the schema-dumper's generated `defineSchema` entrypoint
in `schema-dumper.ts` / `schema-file-generator.ts` / `tasks/database-tasks.ts`
is a separate product API and stays — decision recorded on the parent story).

Depends on the use-fixtures conversion + remaining-callers conversion stories.

Delete the retired invention:

- `defineSchema` function + `DefineSchemaOpts` + `seedSchemaSignatures` (and any
  now-dead signature-cache machinery whose only consumer was `defineSchema`) from
  `test-helpers/define-schema.ts`. KEEP the still-load-bearing exports consumed
  by `canonical-schema.ts` and ~130 `TEST_SCHEMA` importers: `ColumnSpec` /
  `Schema` / `IndexSpec` type family, `COLUMN_TYPE_MAP_{PG,MYSQL,SQLITE}`,
  `serialIdType`, `supportsExpressionIndex`, `columnsOf`, `isWrappedSchema`.
- `test-helpers/define-schema.test.ts` (tests the function).
- `test-helpers/canonical-schema.test.ts:33-37` parity test ("lays down
  byte-for-byte the same schema as defineSchema(TEST_SCHEMA)") — delete/rework,
  since it compares the loader against the deleted function.
- Consider renaming `define-schema.ts` to reflect its residual role (schema-type
  vocabulary) as a single mechanical rename, or fold its remaining exports into
  `canonical-schema.ts`. TEST_SCHEMA deletion is out of scope (130 live callers).
- **Sweep the stale one-schema comment stragglers** the retire story (#4540)
  left behind — the mode is deleted, so these comments now describe nonexistent
  behavior. As of 2026-07-05 (`git grep -n "AR_ONE_SCHEMA\|one.schema" packages/`):
  - `migration.test.ts:129` ("the one-schema..." comment) and `:785` ("under
    AR_ONE_SCHEMA the shared..." comment) — the only `AR_ONE_SCHEMA` reference
    left on main; reword to describe the current canonical/truncate-reset model.
  - `encryption/test-helpers.ts:156` ("Under one-schema mode...") and
    `persistence.trails.test.ts:3` ("one-schema convergence") — reword.
  - `test-helpers/schema-file-generator.test.ts:344` references this very story
    by name; update once the deletion lands.
    Acceptance: `git grep -i "one.schema\|AR_ONE_SCHEMA" packages/ eslint/ scripts/`
    -> 0.

## Acceptance criteria

- No `defineSchema` function/`DefineSchemaOpts` symbol remains in
  `packages/activerecord/src` (dumper generated-name excepted).
- `git grep -i "one.schema\|AR_ONE_SCHEMA" packages/ eslint/ scripts/` -> 0
  (stale comment stragglers from #4540 swept).
- `test:compare` delta >= 0; no test renames.
