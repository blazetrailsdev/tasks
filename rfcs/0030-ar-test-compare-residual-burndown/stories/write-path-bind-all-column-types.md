---
title: "write-path-bind-all-column-types"
status: blocked
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps:
  - pg-pinned-client-write-query-serialization
deps-rfc: []
est-loc: null
priority: 3
pr: 3880
claim: "2026-06-22T13:00:01Z"
assignee: "write-path-bind-all-column-types"
blocked-by: "Blocked on pg-pinned-client-write-query-serialization: binding all write-path values exposes a deterministic PG single-pinned-client query-overlap hang (idle-in-transaction). PR #3880 parked as draft until that prerequisite lands."
---

## Context

`Base#_performInsert` / `Base#_performUpdate`
(`packages/activerecord/src/base.ts:3037`, `:3170`) inline most write-path
column values directly into the SQL string. PR #3727
(adapter-update-prepared-statement-binds) converged the **string/text** subset
to prepared-statement binds (via `Nodes.BindParam` + `toSqlAndBinds`) so
null-byte values round-trip, but deliberately left all other column types
(numbers, dates, binary, json, hstore, enum, custom PG OID types) on the inline
`quote()` path.

This diverges from Rails' `_insert_record` / `_update_record`, which pass
`ActiveModel::Attribute` objects to the Arel `ValuesList` / `Assignment`
visitors; `visit_ActiveModel_Attribute` calls `collector.add_bind(o)`, so
**every** column is sent as a typed prepared-statement parameter
(`type_casted_binds`), carrying the column's type OID to the driver.

Two trails-side obstacles block a naive "bind everything":

1. `_attributes.valuesForDatabase()` returns intermediate objects for some
   types (binary/json) that the driver bind type-cast rejects
   (`can't cast [object Object]`); the inline `quote()` path finishes
   serializing them (JSON.stringify / quotedBinary).
2. An untyped bound parameter loses the implicit cast a custom-OID column
   (hstore, enum) needs — PG raises `cache lookup failed for type`.

Full convergence requires threading column type information into the bind
params (so the driver receives typed binds, like Rails' OID-typed binds) and
ensuring `valueForDatabase` yields a driver-castable value for every type.

## Acceptance criteria

- [ ] INSERT/UPDATE write path binds **all** column values as typed
      prepared-statement parameters (not just string/text), matching Rails'
      `type_casted_binds` — including binary, json, hstore, enum, and custom
      PG OID types.
- [ ] No regression on PG custom-OID columns (hstore/enum/composite) or
      binary/json round-trips across SQLite/MySQL/PostgreSQL.
- [ ] `test:compare` / `api:compare` delta non-negative; test names unchanged.
