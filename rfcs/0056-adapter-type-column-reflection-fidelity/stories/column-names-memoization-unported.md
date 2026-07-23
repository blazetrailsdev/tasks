---
title: "port @column_names memoization with ignoredColumns-safe invalidation"
status: ready
updated: 2026-07-23
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Deferred from #5116 (story attribute-names-table-exists-fail-open-cold-cache),
which ported Rails' `@attribute_names` memoization but not `@column_names`.

Rails memoizes `column_names` (`@column_names ||= columns.map(&:name).freeze`,
vendor/rails/activerecord/lib/active_record/model_schema.rb:478-480; the
sibling `@symbol_column_to_string_name_hash` memo is at :483) and clears both
in `reload_schema_from_cache` (model_schema.rb:553-568).

trails' `columnNames` (packages/activerecord/src/model-schema.ts:213-215)
recomputes `Object.keys(this.columnsHash())` per call, deliberately: the doc
block there notes trails applies the `ignoredColumns` filter at READ time in
`columnsHash()` (Rails filters at load), so a naive memo would go stale on an
`ignoredColumns=` reassignment. #5116 made `ignoredColumns=` /
`table_name=` / `attribute()` clear the attributeNames memo via
`clearAttributeNamesMemo` (model-schema.ts, class + descendants), so the same
invalidation hooks now exist to stamp/clear a `_columnNames` memo — reuse the
`_schemaRevision` stamp pattern from `attributeNames`
(packages/activerecord/src/attribute-methods.ts:633-681). Coordinates with the
ready story ignored-columns-read-time-filter-vs-rails-load-time (moving the
filter to load time would remove the read-time hazard entirely).

## Acceptance criteria

- `columnNames()` memoizes (frozen, per-class own property) and is invalidated
  by every path that clears `_columns`/`_columnsHash` AND by `ignoredColumns=`.
- A regression test proves an `ignoredColumns=` reassignment after a memoized
  read does not serve the stale (pre-ignore) list.
