---
title: "converge-abstract-mysql-schema-migrations-rails-port"
status: done
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4338
claim: "2026-06-30T17:08:39Z"
assignee: "converge-abstract-mysql-schema-migrations-rails-port"
blocked-by: null
---

## Context

Faithful Rails port of
`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/schema_migrations_test.rb`
into `packages/activerecord/src/adapters/abstract-mysql-adapter/schema-migrations.test.ts`.
The 3 trails it-names already match Rails (renaming_index_on_foreign_key,
initializes_schema_migrations_for_encoding_utf8mb4,
initializes_internal_metadata_for_encoding_utf8mb4), but the suite creates
bespoke inline `engines`/`cars` tables via raw CREATE TABLE rather than riding
canonical engines/cars. Converge to canonical tables. Note: canonical
`engines.car_id` is `integer` while Rails schema.rb uses `t.references :car`
(bigint) matching the bigint `cars.id` PK — the FK add in
test_renaming_index_on_foreign_key needs matching types, so this likely
surfaces a canonical-schema fix (engines.car_id -> big_integer) that must be
validated against the rest of the suite, or filed under 0023-surfaced-deviations.

Split from converge-mysql-adapter-ddl-one-schema.

## Acceptance criteria

- [ ] Ride canonical engines/cars; no bespoke inline CREATE TABLE.
- [ ] Resolve the car_id int-vs-bigint FK-type gap (fix canonical schema or
      file 0023-surfaced-deviations); do not bend the test.
- [ ] it-names stay verbatim; assertions mirror Rails.
- [ ] All-or-nothing, <500 LOC.
