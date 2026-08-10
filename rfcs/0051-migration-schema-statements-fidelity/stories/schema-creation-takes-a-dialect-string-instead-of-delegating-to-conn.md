---
title: "SchemaCreation takes an invented dialect string and reimplements eight delegated supports_* predicates"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6247
claim: "2026-08-08T14:51:58Z"
assignee: "migration-ar-config-slot-members-are-spuriously-optional"
blocked-by: null
closed-reason: null
---

## Context

Rails' `SchemaCreation#initialize` takes **one** argument — the connection —
and every capability probe is a delegation to it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:6-21`):

```ruby
def initialize(conn)
  @conn = conn
  @cache = {}
end

delegate :quote_column_name, :quote_table_name, :quote_default_expression, :type_to_sql,
  :options_include_default?, :supports_indexes_in_create?, :use_foreign_keys?,
  :quoted_columns_for_index, :supports_partial_index?, :supports_check_constraints?,
  :supports_index_include?, :supports_exclusion_constraints?, :supports_unique_constraints?,
  :supports_nulls_not_distinct?,
  to: :@conn, private: true
```

trails takes **two**, and the first is an invented dialect _string_
(`connection-adapters/abstract/schema-creation.ts:46-49`):

```ts
constructor(
  protected adapterName: "sqlite" | "postgres" | "mysql",
  protected adapter: SchemaQuoter,
) {}
```

Eight of the delegated predicates are then **reimplemented** against that string
instead of delegating to the connection
(`abstract/schema-creation.ts:53-105`): `supportsPartialIndex`,
`supportsIndexSortOrder`, `supportsIndexUsing`, `supportsIndexInclude`,
`supportsNullsNotDistinct`, `supportsIndexesInCreate`,
`supportsExclusionConstraints`, `supportsUniqueConstraints` — each a
`this.adapterName === "postgres"` / `!== "mysql"` comparison. Rails asks the
adapter; trails asks a label.

This is a live correctness gap, not only a shape gap: the adapter's answers are
version-gated (`abstract_mysql_adapter.rb:416` — `supports_index_sort_order?` is
`database_version >= 10.8.1` on MariaDB, `8.0.1` on MySQL), and a string
comparison cannot see a server version. A MariaDB 10.7 connection renders DDL
that its server rejects.

Surfaced by #6217 (`retire-schemaconn-for-a-leased-connection`): with the
dialect-memoized `schemaConn` gone, the tests that pin this behaviour —
`abstract/schema-creation.test.ts`'s "SchemaCreation support predicates" describe
— are the only ones left that must stay **ungated**, precisely because they
assert the string-keyed invention rather than anything a real connection says.

## Converged shape

- `SchemaCreation` takes `conn` only; drop the `adapterName` parameter and every
  call site's dialect literal.
- Delete the eight reimplemented predicates; delegate each to the connection, as
  the `delegate ... to: :@conn` list does. The adapters already implement them
  (`abstract_adapter.rb` defaults + per-adapter overrides), so this is deletion,
  not new code.
- `abstract/schema-creation.test.ts`'s "SchemaCreation support predicates" tests
  then become adapter-gated like their siblings, since the answer comes from the
  lane's connection.

Depends on / overlaps `thread-adapter-into-every-schema-creation-construction`
(0023), which retires the _host-less_ construction and its
`NATIVE_DATABASE_TYPES_BY_ADAPTER` fallback table. That story removes the
adapter-less path; this one removes the dialect-string parameter and the
predicates keyed off it. Sequencing them the other way round means re-touching
every construction site twice.

## Acceptance criteria

- [ ] `SchemaCreation`'s constructor takes the connection only.
- [ ] None of the eight `supports_*` predicates reads `adapterName`; each
      delegates to the connection.
- [ ] MariaDB/MySQL version gates reach the visitor (a pre-10.8.1 MariaDB
      connection reports `supports_index_sort_order?` false).
- [ ] Green on sqlite (file lane), `sqlite3_mem`, PG and MariaDB.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:extra` non-positive deltas.
