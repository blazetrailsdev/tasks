---
title: "Abstract rename_index clears the schema cache Rails never touches and drops both to_s arms"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6164
claim: "2026-08-07T01:28:29Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working [[rename-index-branch-order-and-polarity]] (PR #6156),
which converged the MySQL override so its unsupported arm now delegates to this
abstract implementation via `super`. That made the abstract body load-bearing
for MySQL/MariaDB as well as everything else, and it diverges from Rails in two
ways.

Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:980-990`):

```ruby
def rename_index(table_name, old_name, new_name)
  old_name = old_name.to_s
  new_name = new_name.to_s
  validate_index_length!(table_name, new_name)

  # this is a naive implementation; some DBs may support this more efficiently (PostgreSQL, for instance)
  old_index_def = indexes(table_name).detect { |i| i.name == old_name }
  return unless old_index_def
  add_index(table_name, old_index_def.columns, name: new_name, unique: old_index_def.unique)
  remove_index(table_name, name: old_name)
end
```

trails
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:977-988`):

```ts
async renameIndex(tableName: string, oldName: string, newName: string): Promise<void> {
  this.validateIndexLengthBang(tableName, newName);

  const oldIndexDef = (await this.indexes(tableName)).find((i) => i.name === oldName);
  if (!oldIndexDef) return;
  await this.schemaCache.clearDataSourceCacheBang(tableName);
  await this.addIndex(tableName, oldIndexDef.columns, { ... });
  await this.removeIndex(tableName, { name: oldName });
}
```

Two divergences:

1. **An invented `clearDataSourceCacheBang` call.** Rails' `rename_index` does
   not touch the schema cache at all — not in this method and not in the MySQL
   override at `abstract_mysql_adapter.rb:359-367`. trails clears it between the
   guard and `add_index`. Any caller relying on that clear is relying on
   behaviour Rails does not have, and the clear also fires on a path where
   Rails leaves the cache warm.

2. **The `to_s` arms are dropped.** Rails coerces both `old_name` and `new_name`
   at `:981-982`, which is what lets a caller pass Symbols — the usual Rails
   migration spelling, `rename_index :people, :old, :new`. trails types both as
   `string` and never coerces, so the Symbol-or-String arm is missing (the
   recurring "Symbols vs strings" conversion class in CLAUDE.md).

Note `:981-982` also means the coercion happens _before_ `validate_index_length!`,
so the validated value is the coerced one.

## Converged shape

Delete the `clearDataSourceCacheBang` call so the body matches `:980-990` line
for line, and add the two `to_s` coercions at the top in Rails' order.

If a test or caller turns out to depend on the cache clear, that dependency is
the bug — fix it at the caller rather than keeping the call here. Worth checking
`renameColumnIndexes` / `renameTableIndexes` (`schema-statements.ts:2100`,
`:2110`), which drive `renameIndex` in a loop and may have been written against
the clearing behaviour.

## Acceptance criteria

- [ ] `renameIndex`'s body matches `abstract/schema_statements.rb:980-990` —
      no schema-cache call.
- [ ] `oldName` / `newName` accept the Symbol-or-String arms Rails accepts,
      coerced before `validateIndexLengthBang` as at `:981-983`.
- [ ] All three adapter lanes green, including the MySQL/MariaDB
      unsupported-`rename_index` path that reaches this body through `super`.
