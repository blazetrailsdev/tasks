---
title: "dumpSchema in canonical-schema.test.ts silently mismatches array-row selectAll shape"
status: in-progress
updated: 2026-07-04
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4565
claim: "2026-07-04T19:07:07Z"
assignee: "fix-canonical-schema-test-dumpschema-array-rows"
blocked-by: null
closed-reason: null
---

## Context

`dumpSchema` in `packages/activerecord/src/test-helpers/canonical-schema.test.ts`
maps rows as `r.type`/`r.name`/`r.sql`, but the BetterSQLite3Adapter `selectAll`
used there returns `{ columns, rows }` with array rows (verified during PR 4551).
So every mapped field is `undefined` and each dump line is
`"undefined undefined: undefined"`. The existing `loadCanonicalSchema` and
`rebuildCanonicalTables` tests only compare dump-to-dump (`toBe`), so they pass
trivially on equal-shaped placeholder rows — they validate row count/order, not
actual schema content (column names, types, defaults, indexes). The sanity floor
(`> 300 lines`) also passes on the undefined rows.

PR 4551 worked around this for its own new tests with a shape-tolerant
`tableNames` reader, but left `dumpSchema` itself unfixed (out of scope).

## Acceptance criteria

- `dumpSchema` reads through the `{ columns, rows }` array-row shape (and the
  object-row shape) so mapped `type`/`name`/`sql` are real values.
- The `loadCanonicalSchema` byte-for-byte parity test then meaningfully asserts
  content, not just equal placeholder rows; keep the `> 300`-line sanity floor.
- No test renames; `test:compare` delta >= 0.
