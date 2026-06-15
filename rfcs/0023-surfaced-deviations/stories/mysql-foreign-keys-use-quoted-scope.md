---
title: "MySQL foreignKeys: scope query via quoted_scope(table_name), not this.quote + DATABASE()"
status: done
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3360
claim: "2026-06-15T15:05:08Z"
assignee: "mysql-foreign-keys-use-quoted-scope"
blocked-by: null
---

## Context

Rails' `AbstractMysqlAdapter#foreign_keys`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:465-485`)
scopes its `information_schema` query through `quoted_scope(table_name)`:

```ruby
scope = quoted_scope(table_name)
# ...
WHERE fk.referenced_column_name IS NOT NULL
  AND fk.table_schema = #{scope[:schema]}
  AND fk.table_name = #{scope[:name]}
  AND rc.constraint_schema = #{scope[:schema]}
```

`quoted_scope` parses a possibly schema-qualified `db.table` name and quotes
each part, honoring an explicit schema rather than assuming the current
database.

trails' `foreignKeys` (`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:713`)
hardcodes `DATABASE()` for the schema and quotes the table directly:

```ts
WHERE fk.referenced_column_name IS NOT NULL
  AND fk.table_schema = DATABASE()
  AND fk.table_name = ${this.quote(tableName)}
  AND rc.constraint_schema = DATABASE()
  AND rc.table_name = ${this.quote(tableName)}
```

This breaks for a schema-qualified `tableName` (`otherdb.widgets`): Rails routes
it to `schema = 'otherdb'`, while trails forces `table_schema = DATABASE()` and
quotes the whole `otherdb.widgets` string as a single table name. trails already
has the `quotedScope` helper (used by `checkConstraints` at
`abstract-mysql-adapter.ts:1018`), so this is a swap to the existing helper, not
new machinery. (`abstract-mysql-adapter.ts:990` carries a separate stub
`foreignKeys` returning `[]`; the real implementation is the
`mysql/schema-statements.ts` one and the `mysql2-adapter.ts:1393` override that
calls it.)

## Acceptance criteria

- [ ] `mysql/schema-statements.ts#foreignKeys` derives `scope =
quotedScope.call(this, tableName)` and interpolates `scope.schema` /
      `scope.name` for both the `fk.*` and `rc.*` predicates, matching Rails
      `abstract_mysql_adapter.rb:465-485`; no remaining `DATABASE()` /
      `this.quote(tableName)` in the foreign-keys SQL.
- [ ] A schema-qualified `tableName` scopes to the named schema (parity with
      `quoted_scope`); the unqualified case is unchanged.
- [ ] Existing `mysql/schema-statements.test.ts` foreignKeys cases and the
      `mysql2-adapter.test.ts` foreignKeys cases stay green on MySQL 8 + MariaDB.
- [ ] api:compare / test:compare delta non-negative.
