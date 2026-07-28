---
title: "SQLite alterTable drops foreign keys on a renamed column instead of remapping them"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `alterTable` to `schemaCreation` in PR #5487.

Rails' `alter_table` remaps foreign keys across a column rename before
handing them to the definition
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:570-575`):

```ruby
foreign_keys.each do |fk|
  if column = rename[fk.options[:column]]
    fk.options[:column] = column
  end
  to_table = strip_table_name_prefix_and_suffix(fk.to_table)
  definition.foreign_key(to_table, **fk.options)
end
```

trails' `alterTable` has no rename map. It filters instead: a foreign key
whose columns are not all still present is silently skipped
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2496-2503`,
unchanged in shape by #5487, which only replaced the SQL-string building).
So `renameColumn` on an FK column drops the foreign key rather than
re-pointing it, with no error.

Rails also strips the table-name prefix/suffix from `fk.to_table` before
re-adding it, because `new_foreign_key_definition` re-applies it. trails
pushes the reflected `ForeignKeyDefinition` straight onto the definition,
which sidesteps the double-prefix but also skips the strip/re-add round trip
entirely — worth confirming behaves identically under a configured
`table_name_prefix`.

## Acceptance criteria

- [ ] `alterTable` accepts a rename map and re-points foreign keys across a
      column rename instead of dropping them, mirroring `alter_table`'s
      `caller` lambda.
- [ ] A regression test renames an FK-bearing column and asserts the foreign
      key survives pointing at the new column name; it fails on baseline.
- [ ] Behaviour under a configured `table_name_prefix` / `table_name_suffix`
      is asserted or the divergence is documented at the call site.
- [ ] Green on all three adapters, in particular `migration/foreign-key.test.ts`
      and `sqlite3-copy-table.test.ts`.
