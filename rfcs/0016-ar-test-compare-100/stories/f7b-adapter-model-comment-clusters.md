---
title: "f7b-adapter-model-comment-clusters"
status: draft
updated: 2026-06-10
rfc: "0016-ar-test-compare-100"
cluster: clusters
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Remainder of F-7 (`f7-fixtures-backed-clusters`, PR un-skipped 7 SQLite-runnable
fixture/schema tests in `adapter.test.ts` via fresh in-memory adapters). The
following `adapter_test.rb` sub-clusters were deferred to keep F-7 under the
300 LOC ceiling:

- **model-backed (handler + AR models + fixtures)**: `select methods passing a
relation`, `select methods passing a association relation`,
  `exceptions from notifications are not translated`, `update prepared
statement` (Book null-byte), `create record with pk as zero` (Book).
- **exec_query columns**: `#exec_query queries with no result set...` and
  `...with an empty result set still return the columns` — the second needs a
  SQLite3Adapter `execQuery` override that returns column metadata from the
  prepared statement even on a zero-row result (default `execQuery` uses
  `Result.fromRowHashes` which drops columns when there are no rows).
- **removeIndex validation**: `remove index when name and wrong column name
specified` (+ positional argument form) — needs Rails' `index_name_for_remove`
  validation ported (raise ArgumentError on no-match / multi-match) AND a
  `removeIndex(table, column, options)` 3-arg signature (current API only takes
  `(table, columnOrOptions)`, so the positional form can't be expressed).
- **type_to_sql**: `type_to_sql returns a String for unmapped types` — Rails
  returns the type verbatim; trails' `schema-creation.ts` default branch
  uppercases bare keywords as a DDL-style convention. Changing it may affect DDL
  snapshots; verify the full suite.
- **non-SQLite (route to Phase 3 / F-4)**: `value limit violations...`,
  `numeric value out of ranges...` (non-SQLite only), `charset`,
  `show nonexistent variable returns nil`, `not specifying database name for
cross database selects`, `current database` (MySQL/PG), `advisory locks
enabled?` (PG), FK cluster, query-cache/truncate/reset-pk cluster,
  transactions/connection-pool clusters.
- **comment cluster (17)**: gated on I-1 (`columnSpec`, now merged #3046) — the
  column-comment dump/introspection tests. Locate precisely (may live in
  `schema.test.ts` / column-comment tests, not `adapter.test.ts`).

## Acceptance criteria

- [ ] model-backed adapter tests un-skipped (handler harness + canonical
      Book/Post/Author/Event models + fixtures).
- [ ] exec_query column-metadata override + both `#exec_query` tests un-skipped.
- [ ] removeIndex ArgumentError validation + positional signature + both
      `remove index ... wrong column name` tests un-skipped.
- [ ] `type_to_sql returns a String for unmapped types` un-skipped (verify no
      DDL snapshot regressions).
- [ ] comment cluster located and un-skipped.

## Notes

Ours: `adapter.test.ts` (+ wherever the comment cluster lives). Rails:
`test/cases/adapter_test.rb`. `has_one_through_associations_test.rb` is already
done (only 2 remaining skips are legitimately Ruby-only private-method
visibility, N/A in TS).
