---
title: "MySQL addIndex is defined twice; Rails defines it only on AbstractMysqlAdapter"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6300
claim: "2026-08-09T20:59:21Z"
assignee: "adapter-class-sync-swallows-the-pool-error-rails-raises"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6287 while reordering `CreateIndexDefinition`'s constructor to
Rails' `(index, algorithm, if_not_exists)`.

Rails defines the MySQL index-DDL pair exactly once, on the adapter
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:445-458`):

    def add_index(table_name, column_name, **options)
      create_index = build_create_index_definition(table_name, column_name, **options)
      return unless create_index
      execute schema_creation.accept(create_index)
    end

    def build_create_index_definition(table_name, column_name, **options)
      index, algorithm, if_not_exists = add_index_options(table_name, column_name, **options)
      return if if_not_exists && index_exists?(table_name, column_name, name: index.name)
      CreateIndexDefinition.new(index, algorithm)
    end

`MySQL::SchemaStatements` (`connection_adapters/mysql/schema_statements.rb`)
defines neither — grep it for `def add_index` and `def build_create_index_definition`:
zero hits.

trails has the pair in **both** places:
`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:930`
(`buildCreateIndexDefinition`, the Rails-shaped one) and an `override addIndex`
in `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:63-78`
that inlines the same `addIndexOptions` → `indexExists` pre-flight →
`CreateIndexDefinition` → `execute` sequence rather than calling
`buildCreateIndexDefinition`. Two copies of one Rails body drift
independently — the argument reorder in #6287 had to be applied to both, and a
future fix to the pre-flight will land in one and not the other.

## Converged shape

Delete the `mysql/schema-statements.ts` `addIndex` override. The Rails method
that owns this is `AbstractMysqlAdapter#add_index` (abstract_mysql_adapter.rb:445),
delegating to `build_create_index_definition` (:452) — one call site, one
definition, in the file whose Rails counterpart declares it.

The override's JSDoc argues for the `indexExists` pre-flight on MariaDB
(`MysqlSchemaCreation` omits the index-level `IF NOT EXISTS`); note that Rails
makes the same pre-flight at abstract_mysql_adapter.rb:455, so the reason
survives the dedupe unchanged — it just belongs in the one Rails-shaped body.

## Acceptance criteria

- [ ] `mysql/schema-statements.ts` has no `addIndex`; MySQL index DDL flows
      through `AbstractMysqlAdapter#addIndex` → `buildCreateIndexDefinition`,
      matching abstract_mysql_adapter.rb:445-458.
- [ ] The `if_not_exists` pre-flight is stated once, at :455's position.
- [ ] MySQL/MariaDB lane green (the `active-schema` index suites in particular).
