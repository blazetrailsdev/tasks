---
title: "mysql2 execQuery derives columns from row keys, not field descriptors (cast_result parity)"
status: in-progress
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3334
claim: "2026-06-15T12:15:08Z"
assignee: "mysql2-cast-result-fields-not-row-keys"
blocked-by: null
---

## Context

Surfaced while fixing `selectall-columns-empty-on-zero-rows` (PR #3224).

Rails' `Mysql2Adapter#cast_result`
(`activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:111-124`)
always builds the result from field descriptors:

```ruby
def cast_result(result)
  fields = result.fields
  result = if fields.empty?
    ActiveRecord::Result.empty
  else
    ActiveRecord::Result.new(fields, result.to_a)
  end
  ...
end
```

Our `Mysql2Adapter.execQuery` only uses the field descriptors on the
zero-row path (fixed in #3224). For the non-empty path it still calls
`Result.fromRowHashes(rows)`, which derives the column set from the keys
of the first row object. This diverges from Rails on **duplicate column
names** (e.g. `SELECT 1 AS a, 2 AS a`): Rails preserves both columns via
`fields` + positional `to_a`, while our object-keyed rows collapse them.

Note the node `mysql2` driver returns rows as objects by default, so
recovering duplicates requires requesting array-mode rows (or mapping
positionally by field index). Scope includes deciding whether to route
the non-empty path through `fields` for full `cast_result` parity, and
what the duplicate-column behavior should be given the driver.

## Acceptance criteria

- `Mysql2Adapter.execQuery` builds its `Result` columns from field
  descriptors on the non-empty path, matching Rails `cast_result`.
- Duplicate column names in a SELECT are preserved (or the deviation is
  explicitly documented if the driver makes it infeasible).
- Test mirrors the relevant Rails coverage verbatim.
