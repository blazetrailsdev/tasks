---
title: "enroll-activerecord-in-protocol-call-mapping"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
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

`PROTOCOL_CALL_ENROLLED_PACKAGES` (`scripts/parity/conventions.ts`) maps a Rails
body's calls to `PROTOCOL_DEFINITION_NAMES` (`inspect`, `dup`, `to_a`, `to_h`,
`to_hash`, …) into the call gate through `rubyCallToTs`, so a port that drops
a `.dup` or renders with `JSON.stringify` where Rails calls `inspect` is
flagged. `inspect` is credited by ruby-compat's `rbInspect`
(`Kernel#inspect` in `scripts/parity/ruby-compat.ts`), `to_a` by `toArray`.

The set is only-grow, and `activerecord` was left out because enrolling it adds these
46 rows (measured by adding `"activerecord"` to the set and running
`pnpm parity:api:calls`):

- `associations/collection-association.ts` `include?` omits `to_h`
- `connection-adapters/abstract/schema-dumper.ts` `column_spec_for_primary_key` omits `inspect`
- `connection-adapters/abstract/schema-dumper.ts` `prepare_column_options` omits `inspect`
- `connection-adapters/abstract/schema-dumper.ts` `schema_collation` omits `inspect`
- `connection-adapters/abstract/schema-dumper.ts` `schema_expression` omits `inspect`
- `connection-adapters/abstract/schema-dumper.ts` `schema_precision` omits `inspect`
- `connection-adapters/abstract/schema-dumper.ts` `schema_scale` omits `inspect`
- `connection-adapters/abstract/schema-statements.ts` `distinct_relation_for_primary_key` omits `to_h`
- `connection-adapters/mysql/schema-dumper.ts` `extract_expression_for_virtual_column` omits `inspect`
- `connection-adapters/mysql/schema-dumper.ts` `prepare_column_options` omits `inspect`
- `connection-adapters/mysql/schema-dumper.ts` `schema_collation` omits `inspect`
- `connection-adapters/mysql/schema-statements.ts` `indexes` omits `to_h`
- `connection-adapters/postgresql-adapter.ts` `enum_types` omits `to_a`
- `connection-adapters/postgresql-adapter.ts` `update_typemap_for_default_timezone` omits `to_h`
- `connection-adapters/postgresql/oid/hstore.ts` `deserialize` omits `inspect`
- `connection-adapters/postgresql/oid/interval.ts` `type_cast_for_schema` omits `inspect`
- `connection-adapters/postgresql/schema-dumper.ts` `exclusion_constraints_in_create` omits `inspect`
- `connection-adapters/postgresql/schema-dumper.ts` `extract_expression_for_virtual_column` omits `inspect`
- `connection-adapters/postgresql/schema-dumper.ts` `prepare_column_options` omits `inspect`
- `connection-adapters/postgresql/schema-dumper.ts` `unique_constraints_in_create` omits `inspect`
- `connection-adapters/schema-cache.ts` `encode_with` omits `to_h`
- `connection-adapters/sqlite3-adapter.ts` `foreign_keys` omits `order:toArray,tableStructureSql`
- `connection-adapters/sqlite3-adapter.ts` `foreign_keys` omits `to_h`
- `connection-adapters/sqlite3-adapter.ts` `virtual_tables` omits `to_a`
- `connection-adapters/sqlite3/schema-dumper.ts` `extract_expression_for_virtual_column` omits `inspect`
- `connection-adapters/sqlite3/schema-dumper.ts` `prepare_column_options` omits `inspect`
- `connection-adapters/sqlite3/schema-dumper.ts` `virtual_tables` omits `inspect`
- `core.ts` `inspect` omits `connected?`
- `core.ts` `inspect` omits `table_exists?`
- `encryption/encryptable-record.ts` `build_decrypt_attribute_assignments` omits `to_h`
- `fixture-set/file.ts` `validate` omits `inspect`
- `relation.ts` `inspect` omits `annotate`
- `relation/finder-methods.ts` `find_one` omits `to_h`
- `relation/finder-methods.ts` `include?` omits `to_h`
- `relation/predicate-builder.ts` `expand_from_hash` omits `to_h`
- `relation/predicate-builder/association-query-value.ts` `queries` omits `to_h`
- `relation/query-methods.ts` `validate_order_args` omits `inspect`
- `relation/query-methods.ts` `validate_order_args` omits `to_a`
- `schema-dumper.ts` `check_constraints_in_create` omits `inspect`
- `schema-dumper.ts` `check_parts` omits `inspect`
- `schema-dumper.ts` `foreign_keys` omits `inspect`
- `schema-dumper.ts` `index_parts` omits `inspect`
- `schema-dumper.ts` `indexes` omits `inspect`
- `schema-dumper.ts` `table` omits `inspect`
- `tasks/database-tasks.ts` `migrations_paths` omits `to_a`
- `type/decimal-without-scale.ts` `type_cast_for_schema` omits `inspect`

## Acceptance criteria

- Each row above is converged in the TS body — the call Rails makes is made,
  `inspect` through `rbInspect` or the value's own ported `inspect`, `dup`
  as the receiver's `dup` — citing the Rails `file:line`. None is baselined.
- `"activerecord"` is added to `PROTOCOL_CALL_ENROLLED_PACKAGES`, and
  `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
  `pnpm parity:api:calls:ruby-compat` are green with it enrolled.
