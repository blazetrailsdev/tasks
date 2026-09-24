---
title: "MySQL SchemaDumper queries collation and virtual-column expressions in line"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 9
pr: trails#8036
claim: "2026-09-24T15:31:05Z"
assignee: "adapter-driver-open-close-and-transaction-status-shims"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-sync-shim-permanent-receipts`. Rails'
`MySQL::SchemaDumper#schema_collation` and `#extract_expression_for_virtual_column`
query in line (`activerecord/lib/active_record/connection_adapters/mysql/schema_dumper.rb:65-86`):
`internal_exec_query("SHOW TABLE STATUS LIKE ...").first["Collation"]`, and
`query_value("SELECT generation_expression FROM information_schema.columns ...")`.
trails' ports (`connection-adapters/mysql/schema-dumper.ts`) read caches an
async pre-pass warms (`_tableCollationCache`, `virtualExpressionCache`),
because the dumper's per-column callbacks are synchronous. Six
`@missingRailsCall` tags (`first`, `internal_exec_query`, `quote`,
`query_value`, `quote_column_name`) record the gap.

## Acceptance criteria

- `schemaCollation` / `extractExpressionForVirtualColumn` issue Rails' queries
  (the dumper's column pass awaits them), the pre-warm caches are deleted,
  and the six `@missingRailsCall` tags go with them.
