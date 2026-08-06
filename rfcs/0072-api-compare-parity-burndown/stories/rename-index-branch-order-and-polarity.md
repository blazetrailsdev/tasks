---
title: "MySQL rename_index hoists validate_index_length! out of the supports arm and inverts the branch"
status: done
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6156
claim: "2026-08-06T14:43:07Z"
assignee: "ruby-time-carries-no-fractional-seconds"
blocked-by: null
closed-reason: null
---

## Context

Spotted while working `rename-column-for-alter-hand-warms-database-version`
(PR #6146), which touched the adjacent line but left this alone.

Rails' `rename_index`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:359-367`):

```ruby
def rename_index(table_name, old_name, new_name)
  if supports_rename_index?
    validate_index_length!(table_name, new_name)

    execute "ALTER TABLE #{quote_table_name(table_name)} RENAME INDEX #{quote_table_name(old_name)} TO #{quote_table_name(new_name)}"
  else
    super
  end
end
```

`validate_index_length!` runs **inside** the `supports_rename_index?` arm.
trails (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:722-730`)
hoists it above the branch, so it runs on the unsupported path too:

```ts
await this.schemaCache.clearDataSourceCacheBang(tableName);
await this.pool.serverVersion(this);
this.validateIndexLengthBang(tableName, newName);
if (!this.supportsRenameIndex()) {
  /* drop + recreate */
}
```

This is a guard-order divergence with observable behaviour: on MySQL < 5.7 /
MariaDB where `supports_rename_index?` is false, Rails reaches its `super`
(`abstract/schema_statements.rb#rename_index`, which does its own
`validate_index_length!`) while trails validates first against the MySQL rules.
The polarity is also inverted (`if !supports` + fallthrough vs Rails' positive
arm + `else super`).

Note trails also expands Rails' `super` inline into a drop/recreate block rather
than delegating, which is a separate decomposition divergence in the same method.

## Converged shape

Restore Rails' branch order and polarity: positive `if (this.supportsRenameIndex())`
arm containing `validateIndexLengthBang` then the `ALTER TABLE ... RENAME INDEX`
execute, with an `else` that delegates to the abstract implementation rather than
re-implementing drop/recreate inline. Keep the `pool.serverVersion` warm where it
is (see `rename-column-for-alter-hand-warms-database-version` for why it cannot
go yet).

## Acceptance criteria

- [ ] `validateIndexLengthBang` runs only on the supported path, as at `:361`.
- [ ] Branch polarity matches `:360` (positive arm first, `else` second).
- [ ] The unsupported arm delegates to the abstract `renameIndex` rather than
      inlining drop/recreate, or the inline expansion is cited at the call site.
- [ ] MySQL/MariaDB lanes green, including a pre-5.7 / MariaDB unsupported-path
      case.
