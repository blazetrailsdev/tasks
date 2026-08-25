---
title: "Converge the sqlite3 introspection and quoting call sets"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: ["converge-sqlite3-adapter-wide-call-set"]
deps-rfc: []
est-loc: 250
priority: null
pr: 5934
claim: "2026-08-02T23:45:48Z"
assignee: "converge-sqlite3-introspection-and-quoting-call-set"
blocked-by: null
closed-reason: null
---

## Context

Second half of `converge-sqlite3-adapter-wide-call-set`, split out 2026-07-30 to
keep each PR under the 500-LOC ceiling. That story keeps the transaction-entry +
foreign-key / check-constraint arms; this one owns the introspection and quoting
arms.

17 entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/sqlite3-adapter.json`
(count re-verified 2026-07-30) where the trails body
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` and
`connection-adapters/sqlite3/schema-statements.ts`) omits a call Rails makes.

Anchors:
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`
and `.../sqlite3/schema_statements.rb`.

Introspection / exec primitives (15 entries):

- `indexes` (4) drops `filter_map`, `internal_exec_query`, `query_value`,
  `quote`.
- `virtual_table_exists?` (3) drops `any?`, `data_source_sql`, `query_values`.
- `explain` (4) drops `internal_exec_query`, `new`, `pp`, `to_sql`.
- `check_constraints` (3) drops `map`, `query_value`, `quote`.

Quoting / casting (6 entries):

- `quote_string` drops `quote`; `quoted_time` drops `change`;
  `quote_default_expression` drops `call`, `match?`; `type_cast` drops `encode`;
  `returning_column_values` drops `first`.

Interaction to check before starting: `sqlite-copy-table-family-bypasses-execute-primitives`
(RFC 0076) is converging the same file's DDL onto the `execute` /
`internal_exec_query` primitives, and `converge-internal-exec-query-through-perform-query`
(RFC 0076) sits one layer below. Confirm which of those has landed so the
`internal_exec_query` routing here builds on the converged primitive rather than
racing it.

## Acceptance criteria

- `indexes`, `virtual_table_exists?`, `explain` and `check_constraints` route
  through the ported `internalExecQuery` / `queryValue` / `queryValues` /
  `dataSourceSql` primitives where the Rails body does.
- The quoting/casting bodies make the calls Rails makes, or each surviving
  baseline entry carries a specific per-entry reason naming the equivalent path
  (not the generic RFC 0047 seed text).
- `pnpm parity:api:calls` passes with a strictly smaller baseline; state the
  before/after entry count for this file in the PR body.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/sqlite3/`.
- Green on the sqlite3 lane, including `sqlite3_mem` — raw-adapter divergences
  are masked on the file-backed lane.

## Sequencing

Do not run concurrently with `converge-sqlite3-adapter-wide-call-set`: both edit
`sqlite3-adapter.ts` and `sqlite3/schema-statements.ts`, in different bodies.
Ship that one first, then branch this from updated `main`.
