---
title: "copyTableIndexes hand-builds CREATE INDEX instead of delegating to addIndex"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
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

Surfaced in #5505 (story `converge-connection-adapters-sqlite3-bespoke-tables`).

Rails' `copy_table_indexes`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`)
builds an options hash and delegates to `add_index`:

```ruby
options = { name: name.gsub(/(^|_)(#{from})_/, "\\1#{to}_"), internal: true }
options[:unique] = true if index.unique
options[:where] = index.where if index.where
options[:order] = index.orders if index.orders
add_index(to, columns, **options)
```

Ours (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`,
`copyTableIndexes`) hand-builds the `CREATE INDEX` string instead. #5505 brought
the emitted SQL to parity for the cases the canonical `books` indexes exercise
(the `columns.is_a?(Array)` gate, `where`, and value-agnostic `orders` upcasing
per `add_index_sort_order`, abstract/schema_statements.rb:1622-1627), but the
structural deviation remains: nothing routes through `add_index`, so
`internal: true`, the index-name length validation, the
`supports_index_sort_order?` gate, and any future `add_index` behaviour are all
bypassed.

## Acceptance criteria

- [ ] `copyTableIndexes` delegates to `addIndex` with the same options hash
      Rails builds, or the remaining divergences are justified at the call site
      with the Rails `file:line` that makes delegation impossible in TS.
- [ ] Existing coverage stays green:
      `connection-adapters/sqlite3-copy-table.test.ts` (partial index,
      expression index, orders) and `adapters/sqlite3/copy-table.test.ts`.
