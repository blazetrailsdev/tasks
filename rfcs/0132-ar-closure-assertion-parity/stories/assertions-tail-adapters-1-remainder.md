---
title: "assertions-tail-adapters-1-remainder"
status: ready
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
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

Remainder of assertions-tail-adapters-1 (RFC 0132). Only `uuid_test.rb` `acceptable uuid regex` and `uuid formats` were converged (pure `Uuid#cast` loops, trails#PR). Everything else is unconverged. PG and MySQL test dirs are excluded from the local vitest project, so those files need a PG/MySQL environment (or CI) to verify.

Re-measured mismatch lines (`pnpm parity:test -- --package activerecord --assertions --missing`):

- connection_adapters/schema_cache_test.rb — 33
- adapters/postgresql/uuid_test.rb — 28 remaining (tests are bespoke `CREATE TABLE`; should use canonical `uuid_data_type`/`uuid_type` from vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb and the UUIDType model)
- connection_adapters/connection_handler_test.rb — 25
- adapters/postgresql/enum_test.rb — 25
- adapters/mysql2/mysql2_adapter_test.rb — 23
- connection_adapters/connection_handlers_multi_db_test.rb — 20
- adapters/postgresql/bytea_test.rb — 18
- adapters/abstract_mysql_adapter/connection_test.rb — 17

## Acceptance criteria

Each file reports 0 count/kind/value mismatches; failing converged bodies parked `it.skip` with `BLOCKED:` per the RFC 0132 procedure.
