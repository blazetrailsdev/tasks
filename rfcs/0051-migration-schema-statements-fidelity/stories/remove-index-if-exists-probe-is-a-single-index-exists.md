---
title: "removeIndex's ifExists probe should be Rails' single index_exists? call"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: 6118
claim: "2026-08-05T03:29:59Z"
assignee: "port-respond-to-missing-finder-to-dynamic-matchers"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#removeIndex`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`)
resolves its `ifExists` short-circuit with a two-way branch:

```ts
if (opts.ifExists) {
  const colSpec = columnName ?? opts.column;
  const present =
    colSpec != null
      ? await this.indexExists(tableName, colSpec, opts)
      : opts.name != null && (await this.indexNameExists(tableName, opts.name));
  if (!present) return;
}
```

Rails' `remove_index`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:966-972`)
has no branch at all — it is one call:

```ruby
return if options[:if_exists] && !index_exists?(table_name, column_name, **options)
```

`index_exists?` (`:102`) already handles the name-only case: `Index#defined_for?`
(`schema_definitions.rb:56`) skips the column comparison when columns are blank
and matches on `name` alone. PostgreSQL's `remove_index` override
(`postgresql/schema_statements.rb:557`) delegates to `index_exists?` the same
single way, so the two paths diverge on which probe runs.

The `colSpec = columnName ?? opts.column` fallback is now redundant too:
`remove-schema-statements-dispatch-shim-companion-mixin-duality` (PR #5812) gave
`indexExists` the `columns = options[:column] if columns.blank?` arm from
`defined_for?`, so it reads `options.column` itself.

Noticed while fixing that arm; left alone there because changing which probe the
name-only path runs (`indexNameExists` issues its own targeted query, where
`indexExists` scans `indexes(table)`) is a behavior change beyond that story.

## Acceptance criteria

- The `ifExists` block becomes Rails' single
  `indexExists(tableName, columnName, opts)` call; the `indexNameExists` branch
  and the `colSpec` fallback go away.
- `indexNameExists` keeps whatever other callers it has, or goes with the branch
  if this was its only one.
- The Rails-paired `remove_index` cases in `migration.test.ts`
  (`test_remove_index_with_name_which_does_not_exist_doesnt_raise_with_option`
  and siblings) stay green, and any assertQueries counts that shift because the
  name-only path now scans `indexes(table)` are updated with that reason.
- SQLite, MySQL and PostgreSQL lanes green.
