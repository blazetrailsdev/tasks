---
title: "index-name-exists-returns-index"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6562
claim: "2026-08-15T12:45:04Z"
assignee: "index-name-exists-returns-index"
blocked-by: null
closed-reason: null
---

# `index_name_exists?` returns the Index, not a boolean

## Context

Surfaced converging the RFC 0106 call-set row
`abstract/schema-statements.ts` / `index_name_exists?` / `detect`.

Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1524-1527`):

```ruby
def index_name_exists?(table_name, index_name)
  index_name = index_name.to_s
  indexes(table_name).detect { |i| i.name == index_name }
end
```

`detect` returns the `IndexDefinition` or `nil` — a value-returning predicate.
trails' `indexNameExists` (same file) is typed `Promise<boolean>` and returns
`idxs.some(...)`, so the call-set row cannot be converged without also changing
the return type, and any caller that wanted the definition has no way to get it.
The row was left baselined with a reviewed reason rather than converged blind.

## Acceptance criteria

- [ ] `indexNameExists` returns the matching index or `undefined`, mirroring
      Rails' `detect`, and the `index_name.to_s` normalization is ported.
- [ ] Every call site is checked — a `boolean`-consuming caller must still read
      correctly (Ruby truthiness rules: see CLAUDE.md "Predicates").
- [ ] The `index_name_exists?` / `detect` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/schema-statements.json`
      and the mark tightened with `pnpm parity:api:calls:tighten`.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
