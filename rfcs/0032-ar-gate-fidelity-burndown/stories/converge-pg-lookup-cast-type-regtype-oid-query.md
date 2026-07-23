---
title: "converge-pg-lookup-cast-type-regtype-oid-query"
status: ready
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
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

# Converge PG lookupCastType on Rails' live regtype OID query

## Context

Rails' PG `lookup_cast_type(sql_type)`
(vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:195)
resolves a sql_type string to an OID with a live
`SELECT '<sql_type>'::regtype::oid` SCHEMA query, then looks up the OID-keyed
type map. Every DDL default-quoting on a `ColumnDefinition` (no OID) routes
through it: `quote_default_expression` (abstract quoting) →
`lookup_cast_type(column.sql_type)`, reached from
`visit_ChangeColumnDefinition`
(vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_creation.rb:102)
and `add_column_options!` on CREATE TABLE / ADD COLUMN defaults.

trails instead resolves the string statically via `normalizeFormatType` /
`FORMAT_TYPE_ALIASES`
(packages/activerecord/src/connection-adapters/postgresql-adapter.ts, ~5463)
in the sqlType branch of `lookupCastTypeFromColumn` (~959), consumed by the
PG `quoteDefaultExpression` override (~3613). Documented there as a tracked
deviation citing this story (added by the
pg-quote-default-regtype-typemap-lookup PR).

Blocker / why it wasn't done in that PR: `quoteDefaultExpression` and the
whole `SchemaCreation` visitor chain
(packages/activerecord/src/connection-adapters/abstract/schema-creation.ts
`accept`, postgresql/schema-creation.ts `visitChangeColumnDefinition`) are
synchronous — issuing the query means asyncifying the visitor chain across
all three adapters (or pre-resolving cast types in the async DDL entry
points: createTable / addColumn / changeColumn / bulk changeTable), a
multi-PR ripple far beyond the 500 LOC ceiling.

Observable consequences today: PG bulk-alter query counts are one lower than
Rails (`packages/activerecord/src/migration.test.ts` "changing columns" 2 vs
migration_test.rb:1403's 3; "changing column null with default" 4 vs
migration_test.rb:1433's 5), and custom types (enums/domains) that only the
regtype round-trip would resolve fall through to ValueType in DDL default
quoting.

## Acceptance criteria

- [ ] PG resolution of a sql_type string to a cast type issues the
      `SELECT '<sql_type>'::regtype::oid` query and looks up the OID-keyed
      type map, matching postgresql/quoting.rb:195 — either by asyncifying
      the SchemaCreation visitor chain or an equivalently faithful
      pre-resolution in the async DDL entry points.
- [ ] migration.test.ts bulk-alter PG expected counts return to Rails' 3/5
      and their deviation comments are removed.
- [ ] The DEVIATION block on `normalizeFormatType` in
      postgresql-adapter.ts is removed.
