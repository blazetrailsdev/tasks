---
title: "Port table_exists? rescue NotImplementedError -> tables.include? fallback"
status: done
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 5486
claim: "2026-07-28T02:40:15Z"
assignee: "table-exists-notimplementederror-tables-fallback"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:59-63`:

```ruby
def table_exists?(table_name)
  query_values(data_source_sql(table_name, type: "BASE TABLE"), "SCHEMA").any? if table_name.present?
rescue NotImplementedError
  tables.include?(table_name.to_s)
end
```

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:589`
`tableExists` issues a per-adapter data-source query and has no `rescue
NotImplementedError` fallback arm, so an adapter that does not implement
`data_source_sql` throws instead of degrading to `tables.include?`.

Surfaced by PR #5331: the wide call-ratchet began flagging
`table_exists? -> tables` once the `tables` renames made the pair comparable.
Baselined with a reason in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-statements.json`.

## Acceptance criteria

- `tableExists` falls back to `tables().includes(...)` when the data-source path
  raises NotImplementedError.
- The `table_exists? -> tables` wide-exclude entry is removed.
