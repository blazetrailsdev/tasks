---
title: "inline-ruby-bodies-extracted-as-named-helpers"
status: draft
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A cluster of `@noRailsEquivalent` names in `packages/activerecord/src/**` are
bodies Rails writes INLINE, extracted into named helpers by the port — the
"no extra abstraction" rule's exact prohibition. Each receipt names its Ruby
site:

- `connection-adapters/abstract/schema-definitions.ts` — the `Array()` splat and
  composite-arity guard of `add_foreign_key`, and the `foreign_key_options` key
  set (abstract/schema_statements.rb:1173-1266)
- `connection-adapters/adapter-args.ts` — the scheme read of
  `ConnectionUrlResolver#to_hash` (connection_url_resolver.rb:38)
- `connection-adapters/postgresql/oid/range.ts` — the nil/infinity bound
  rendering of `Quoting#encode_range` (postgresql/quoting.rb:210)
- `connection-adapters/postgresql/pg-datetime-config.ts` —
  `OID::DateTime#real_type_unless_aliased` (postgresql/oid/date_time.rb:29)
- `connection-adapters/mysql2/database-statements.ts` — the `column_types` map
  `cast_result` reads, and the first-result-set selection of `abandon_results!`
  (mysql2/database_statements.rb:100)
- `connection-adapters/abstract-mysql-adapter.ts` — the `SHOW CREATE TABLE`
  parsing of `#table_options` (abstract_mysql_adapter.rb:549), and the
  `change_column_default_for_alter` override (abstract/schema_statements.rb:1843
  vs abstract_mysql_adapter.rb:373)
- `connection-adapters/mysql/schema-statements.ts` — `AbstractMysqlAdapter#foreign_keys`
  (abstract_mysql_adapter.rb:465) kept in the mixin
- `connection-adapters/mysql/schema-dumper.ts` — `SchemaDumper#prepare_column_options`
  (abstract/schema_dumper.rb:25)
- `connection-adapters/sqlite3/schema-statements.ts` —
  `SQLite3Adapter#extract_value_from_default` (sqlite3_adapter.rb:522)
- `connection-adapters/abstract/quoting.ts` — the byte-source normalization
  before `quoted_binary` (abstract/quoting.rb:206)
- `connection-adapters/abstract/query-cache.ts` — the explicit
  `@pinned_connections_count` increment/decrement of `pin_connection!` /
  `unpin_connection!` (connection_pool.rb:325,340)
- `relation/finder-methods.ts` — the argument dispatch of `#find`
  (finder_methods.rb:98) and both arms of
  `raise_record_not_found_exception!` (finder_methods.rb:426-432)
- `relation/query-methods.ts` — the `PredicateBuilder.references` call of
  `build_where_clause` (query_methods.rb:1640), the `Relation === value` branch
  of `build_bound_sql_literal` (query_methods.rb:1704), and both halves of
  `build_joins` (query_methods.rb:1865-1881)
- `connection-adapters/abstract-adapter.ts` — the adapter-name normalization of
  `ConnectionAdapters.resolve` (connection_adapters.rb:34-39)

## Acceptance criteria

- Each helper is inlined at the Rails site, or folded into the ported method
  that owns the body, and its `@noRailsEquivalent CONVERGEABLE
  inline-ruby-bodies-extracted-as-named-helpers` receipt is deleted with it.
- Split across as many PRs as the LOC ceiling needs; one file per PR is a
  natural cut.
- `pnpm parity:api:extra --package activerecord` novel count strictly drops.
