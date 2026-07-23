---
title: "PG buildChangeColumnDefaultDefinition should carry the live Column (oid/fmod)"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-07-23T16:49:37Z"
assignee: "pg-change-default-definition-carries-live-column"
blocked-by: null
closed-reason: null
---

# PG buildChangeColumnDefaultDefinition synthesizes a ColumnDefinition instead of carrying the live Column

## Context

Rails PG `build_change_column_default_definition`
(vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:489-494)
passes the live `column_for(...)` Column into
`ChangeColumnDefaultDefinition`, so `visit_ChangeColumnDefaultDefinition`
quotes via `lookup_cast_type_from_column(column)` on the (oid, fmod,
sql_type) key — no regtype query. trails' override
(packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts
`buildChangeColumnDefaultDefinition`, ~line 1015) synthesizes a fresh
`ColumnDefinition` carrying only type/array/sqlType and drops the live
column's oid/fmod, so the quoting shim takes the no-OID regtype path — one
extra SCHEMA query per change_default vs Rails, and fmod-dependent types
(numeric precision) lose their modifier.

## Acceptance criteria

- [ ] `ChangeColumnDefaultDefinition` carries the reflected live Column (or at
      least its oid/fmod) as Rails does; the visitor's quoting resolves via the
      OID key without a regtype query.
- [ ] Query-count parity with Rails on the change_default paths verified
      against vendored tests.
