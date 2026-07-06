---
title: "MySQL functional-index columns: collapse to SQL string via add_options_for_index_columns"
status: in-progress
updated: 2026-07-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 21
pr: 4708
claim: "2026-07-06T22:23:52Z"
assignee: "mysql-functional-index-columns-sql-string"
blocked-by: null
---

## Context

Surfaced during review of PR #3347
(`mysql-indexes-introspection-fidelity-gaps`) and inherited from PR #3280
(`extract-mysql2-indexes-introspection`, RFC 0026).

Rails `mysql/schema_statements.rb:41-42,54-65` handles functional
(expression) indexes by building an `expressions` map during the row loop,
then in the final `.map` calling `add_options_for_index_columns` to collapse
the columns array into a single SQL string with the prefix length and order
baked in (a lower-title expression rendered with ORDER DESC inline).
Non-expression indexes keep the array shape with separate `lengths` /
`orders` options.

The trails implementation (`mysql/schema-statements.ts#indexes`) deliberately
skipped both — functional-index columns stay a plain `string[]` (each
expression wrapped in parens) and `orders` is surfaced as a separate Record
keyed by the expression string, rather than collapsed into one SQL string.
PR #3347 added the descending-expression order per the older Rails form but did
NOT converge the column-collapsing behavior, to keep that PR scoped and avoid
the larger return-shape change.

This is a tracked-pending-convergence deviation. The schema dumper's `RichIdx`
currently consumes the array shape, so dumps are functional today, but the
returned `indexes` object shape for functional indexes diverges from Rails'
`IndexDefinition` (string columns vs array + expression map).

## Acceptance criteria

- [ ] `indexes` collapses functional-index columns into a single SQL string
      via an `addOptionsForIndexColumns` equivalent, mirroring Rails'
      `expressions` map + final `.map` transform
      (`mysql/schema_statements.rb:41-42,54-65`).
- [ ] Prefix length and order are baked into the column SQL string for
      functional indexes (matching Rails), not surfaced as separate
      `lengths` / `orders` Records.
- [ ] Non-functional indexes retain the array + separate `lengths` /
      `orders` shape (unchanged).
- [ ] Schema dump output for functional indexes matches Rails; verified on
      MySQL 8.
- [ ] Test names match Rails verbatim.
