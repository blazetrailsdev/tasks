---
title: "mysql-schema-statements-overrides-unreachable-on-adapter"
status: done
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5490
claim: "2026-07-28T12:16:18Z"
assignee: "mysql-schema-statements-overrides-unreachable-on-adapter"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AbstractMysqlAdapter` does `include MySQL::SchemaStatements`
(`abstract_mysql_adapter.rb:9`), so the MySQL module's overrides win over the
base `SchemaStatements` on the adapter itself. trails only does
`include(AbstractAdapter, SchemaStatements)`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:2648`) — the
MySQL companion class `MysqlSchemaStatements`
(`connection-adapters/mysql/schema-statements.ts:29`) is **never mixed onto any
adapter prototype**. It is only reachable through the `this.schemaStatements()`
accessor, which is what `Migration` routes through.

So for a MySQL adapter, `conn.someSchemaMethod(...)` called directly resolves to
`SchemaStatements.prototype`, and every `MysqlSchemaStatements` override is
silently bypassed. The existing `override async addIndex` there carries a comment
admitting as much ("Migration#addIndex routes through this.schema.addIndex(...),
so we override here") — the adapter-direct path is unfixed.

Surfaced on PR #5480 by the Rails case
`references_foreign_key_test.rb:180-186`:

```ruby
test "removing column removes foreign key" do
  @connection.create_table :testings do |t|
    t.references :testing_parent, index: true, foreign_key: true
  end
  assert_difference "@connection.foreign_keys('testings').size", -1 do
    @connection.remove_column :testings, :testing_parent_id
  end
end
```

Rails passes this on MySQL because `MySQL::SchemaStatements#remove_column`
(`mysql/schema_statements.rb:77-82`) drops the FK first:

```ruby
def remove_column(table_name, column_name, type = nil, **options)
  if foreign_key_exists?(table_name, column: column_name)
    remove_foreign_key(table_name, column: column_name)
  end
  super
end
```

trails fails with `ER_FK_COLUMN_CANNOT_DROP` (verified locally on MariaDB, and in
CI on #5480). The test has no adapter guard in Rails, so it must not be gated in
trails either — it was left unported on #5480 rather than shipped with a fake
guard.

Porting the 4-line override alone does **not** fix it: adding it to
`MysqlSchemaStatements` leaves it unreachable (verified — the MariaDB failure was
unchanged), and adding a `removeColumn` to `AbstractMysqlAdapter` instead
recurses, because `SchemaStatements#removeColumn`
(`abstract/schema-statements.ts:434-441`) delegates back to
`adapter.removeColumn` whenever the adapter overrides it. The fix is the dispatch
itself.

## Acceptance criteria

- [ ] MySQL adapters resolve `MysqlSchemaStatements` overrides on the
      adapter-direct path, matching Rails' `include MySQL::SchemaStatements` —
      without reintroducing the `SchemaStatements#removeColumn` delegation
      recursion.
- [ ] `MySQL::SchemaStatements#remove_column` (`mysql/schema_statements.rb:77-82`)
      is ported to `connection-adapters/mysql/schema-statements.ts` and is
      reachable from `conn.removeColumn(...)`.
- [ ] The Rails case "removing column removes foreign key" is added to
      `packages/activerecord/src/migration/references-foreign-key.test.ts` under
      `Migration > ReferencesForeignKeyTest`, with **no** adapter guard, and
      passes on sqlite/postgresql/mysql2.
- [ ] Audit the other `MysqlSchemaStatements` overrides (`addIndex`,
      `schemaCreation`) for behaviour changes once they become reachable.
- [ ] `pnpm parity:test --package activerecord --gates --check` exits 0.
