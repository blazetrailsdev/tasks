---
title: "Keep SqlTypeMetadata#sql_type nil-faithful instead of coercing to empty string"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SqlTypeMetadata#sqlType` is typed `string` and its constructor coerces a
missing value with `options.sqlType ?? options.type ?? ""`
(`packages/activerecord/src/connection-adapters/sql-type-metadata.ts:11,26`).
Rails keeps `@sql_type` nil when `fetch_type_metadata` is handed a nil sql_type
— which `test/support/fake_adapter.rb:23` does directly
(`merge_column(table_name, name, sql_type = nil, …)` → `fetch_type_metadata(sql_type)`).

PR #5520 removed the `?? ""` at the fake adapter's own call site and widened
`SchemaStatements#fetchTypeMetadata` to `string | null`, so the coercion now
happens in exactly one place instead of two. The remaining one is
`SqlTypeMetadata`, whose `sqlType: string` is read by `Column#sqlType` and a
long tail of consumers (quoting, schema dumping, type reflection), which is why
it was left alone there.

Note the sibling behaviour already converged: `#type` is deliberately
nil-faithful (sql-type-metadata.ts:27-31), so `sqlType` is the odd one out.

## Acceptance criteria

- `SqlTypeMetadata#sqlType` is `string | null` and stores a nil sql_type as
  null, matching Rails.
- `Column#sqlType` and its consumers (`lookup_cast_type_from_column`, quoting,
  schema dumper, `deduplicateKey`, `toString`, the JSON round trip) handle the
  null without reintroducing a `?? ""`.
- A column built from `merge_column(table, name)` with no sql_type reports a
  null `sql_type`, as `fake_adapter.rb:23` produces in Rails.
- All adapter lanes green.
