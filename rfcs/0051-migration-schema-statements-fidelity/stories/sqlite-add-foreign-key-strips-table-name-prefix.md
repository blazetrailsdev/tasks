---
title: "sqlite3: addForeignKey must strip the table_name_prefix before re-adding the FK"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' SQLite `add_foreign_key` strips the table-name prefix/suffix off
`to_table` before handing it to the definition, because
`TableDefinition#foreign_key` -> `new_foreign_key_definition` re-applies it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb:56-63`):

```ruby
alter_table(from_table) do |definition|
  to_table = strip_table_name_prefix_and_suffix(to_table)
  definition.foreign_key(to_table, **options)
end
```

trails' `addForeignKey`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:2221-2238`)
passes `toTable` straight through, so with a configured `Base.tableNamePrefix`
the prefix is applied twice. Reproduced while writing the prefix regression
test for PR #5529: `addForeignKey("p_astronauts", "p_rockets", ...)` under
`tableNamePrefix = "p_"` fails with
`SqliteError: no such table: main.p_p_rockets`. The test was written against
`t.references(..., foreignKey: true)` instead to avoid this unrelated bug.

Note `removeForeignKey` on the same adapter already routes through
`stripTableNamePrefixAndSuffix` (same file, :2265), so the two halves disagree.

## Acceptance criteria

- [ ] SQLite `addForeignKey` strips the prefix/suffix from `toTable` before
      `definition.foreignKey`, matching schema_statements.rb:60.
- [ ] A regression test adds a foreign key under a configured
      `tableNamePrefix` (and suffix) and asserts the reflected `toTable` is the
      singly-prefixed real table; it fails on baseline.
- [ ] `migration/foreign-key.test.ts` `add foreign key with prefix` /
      `with suffix` stay green on all three adapters.
