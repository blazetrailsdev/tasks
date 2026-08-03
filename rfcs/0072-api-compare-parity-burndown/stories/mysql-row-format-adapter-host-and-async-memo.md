---
title: "MySQL row-format helpers: read adapter state via this-typed host + async SHOW VARIABLES memo"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: arity-fidelity
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 5958
claim: "2026-08-03T03:45:46Z"
assignee: "mysql-row-format-adapter-host-and-async-memo"
blocked-by: null
closed-reason: null
---

## Context

`mysql/schema_statements.rb:146,154` defines two zero-arg private methods that
read adapter state:

```ruby
def row_format_dynamic_by_default?
  if mariadb? then database_version >= "10.2.2" else database_version >= "5.7.9" end
end

def default_row_format
  return if row_format_dynamic_by_default?
  unless defined?(@default_row_format)
    ... two SHOW VARIABLES queries (innodb_file_per_table / innodb_file_format) ...
  end
  @default_row_format
end
```

The trails port
(`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:165,171`)
is a pair of pure free functions fed `(isMariaDb, databaseVersion)` and
`(isMariaDb, databaseVersion, innodbFilePerTable, innodbFileFormatBarracuda)`.
`defaultRowFormat` has no production caller at all — only
`schema-statements.test.ts` — because the two innodb flags are never queried.

Both are excluded in `scripts/api-compare/arity-exclude.json` with this reason
(added by `arity-state-threading-triage`, PR #5335... see #5340).

## Acceptance criteria

- `isRowFormatDynamicByDefault` and `defaultRowFormat` read adapter state off a
  `this`-typed host (or a `*Host` interface) rather than taking it positionally.
- `defaultRowFormat` performs and memoizes the two `SHOW VARIABLES` lookups as
  Rails does, and is wired into the `create_table` row-format path that Rails
  uses it from, instead of being test-only surface.
- Both entries are removed from `arity-exclude.json` (the ratchet fails on stale
  entries, so this is enforced).
