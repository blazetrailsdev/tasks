---
title: "index_name(table, {column}) uses legacy _and_ form instead of generate_index_name (no length/hash fallback)"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while fixing `removeindex-expression-name-hashing` (PR #3223).

`SchemaStatements.indexName(tableName, { column })`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
~line 859) always returns the legacy `index_<table>_on_<cols joined by _and_>`
form and never applies the length/hash fallback. In Rails 8.0.2
(`schema_statements.rb:992` `index_name`), the `{ column }` branch calls
`generate_index_name(table_name, column)` by default and only uses the bare
`_and_` join when `options[:_uses_legacy_index_name]` is set. So our `indexName`
matches Rails' _legacy_ path, not its default.

Impact: the column-match comparison in `indexNameForRemove` (and the
module-level `indexNameForRemoveFrom` helper's `conventional()`) compares names
via this legacy form, so a very long multi-column index that Rails would
hash-truncate is compared without the fallback. Both sides of the equality use
the same function today, so equality still holds, but the form diverges from
Rails and would matter for any caller that relies on the generated name.

## Acceptance criteria

- `indexName(table, { column })` routes through `generateIndexName` (length/hash
  fallback) by default, matching Rails `index_name`.
- Support the `_uses_legacy_index_name` escape hatch for the bare `_and_` form.
- Update `indexNameForRemove` / `indexNameForRemoveFrom` column-compare to use
  the Rails-faithful `index_name(table, i.columns)` semantics.
- Test names match Rails verbatim.
