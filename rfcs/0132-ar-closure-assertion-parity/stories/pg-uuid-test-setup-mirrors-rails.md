---
title: "pg uuid.test.ts setup mirrors Rails create_table; move trails-only tests out"
status: in-progress
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#7962
claim: "2026-09-22T15:20:51Z"
assignee: "pg-uuid-test-setup-mirrors-rails"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/postgresql/uuid.test.ts` top-level `beforeEach` still builds
`uuid_data_type` with raw SQL (`id serial`, `guid uuid DEFAULT gen_random_uuid()`, an invented
`other_guid`), while Rails' setup (`vendor/rails/activerecord/test/cases/adapters/postgresql/uuid_test.rb:33-44`)
is `connection.create_table "uuid_data_type" { |t| t.uuid "guid" }` with teardown
`UUIDType.reset_column_information; drop_table "uuid_data_type"`. The same describe also carries
~25 trails-only raw-SQL tests ("uuid column", "uuid write", "uuid pk find", ...) with no Rails
counterpart, and the other describes (NilDefault, InverseOf, HasManyThroughDisableJoins) still use
raw `CREATE TABLE` instead of Rails' `create_table(..., id: :uuid, **uuid_default)` setups
(`uuid_test.rb:318-323,362-373,410-424`). The raw `gen_random_uuid()` default also breaks the
non-pgcrypto lane.

## Acceptance criteria

- Setup/teardown of every describe mirror `uuid_test.rb` via `createTable` / `dropTable`.
- Trails-only tests move to `uuid.trails.test.ts` or are deleted.
- `uuid_test.rb` stays at 0 assertion mismatches.
