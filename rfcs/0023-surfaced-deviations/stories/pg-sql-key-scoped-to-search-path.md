---
title: "PG sqlKey should scope statement-pool key to schema_search_path (Rails parity)"
status: claimed
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-15T15:54:30Z"
assignee: "pg-sql-key-scoped-to-search-path"
blocked-by: null
---

## Context

Rails' `PostgreSQLAdapter#sql_key`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:914-916`)
scopes the prepared-statement pool key by the current `schema_search_path`:

```ruby
def sql_key(sql)
  "#{schema_search_path}-#{sql}"
end
```

This matters because the same SQL string resolves to **different tables** under
different search paths (`SELECT * FROM widgets` hits `schema_a.widgets` vs
`schema_b.widgets`). Keying the prepared statement by search-path prevents a
statement prepared under one path from being reused under another.

trails' `sqlKey` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:4982`)
drops the search-path component:

```ts
sqlKey(sql: string): string {
  return `-${sql}`;   // empty schema_search_path prefix
}
```

The JSDoc (`:4977-4979`) documents this as a deliberate shortcut ("search_path
is set once per connection"). But `setSchemaSearchPath` exists and can change the
path mid-connection (and `schemaSearchPath()` is lazily memoized at
`:351`/`:4182`), so a prepared statement cached under the old path can be reused
after a path change — a latent correctness gap. Per "always converge", this
should match Rails rather than rely on the once-per-connection assumption.

## Acceptance criteria

- [ ] `sqlKey` incorporates the current `schemaSearchPath()` into the key,
      mirroring `sql_key` (`postgresql_adapter.rb:914-916`): a statement prepared
      under one search path is not reused under another.
- [ ] `setSchemaSearchPath` invalidates / re-scopes appropriately so the keys
      track the active path (no stale prepared statement after a path change).
- [ ] Test: preparing the same SQL under two different search paths yields two
      pool entries (and resolves the correct table each time).
- [ ] api:compare / test:compare delta non-negative.
