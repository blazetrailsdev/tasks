---
title: "AdapterSchemaSource hand-projects column flags; Rails passes real Column objects"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AdapterSchemaSource#columns` (packages/activerecord/src/schema-dumper.ts:238-295)
hand-projects every reflected `Column` into a plain `ColumnInfo` literal, and
duck-types each behavioural flag:

```ts
const isVirtual =
  typeof (col as any).isVirtual === "function"
    ? (col as any).isVirtual()
    : (col as any).virtual === true;
```

Rails has no counterpart. `ActiveRecord::ConnectionAdapters::SchemaDumper`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_dumper.rb)
receives the real `Column` objects from `connection.columns(table)` and calls
`column.virtual?` / `column.virtual_stored?` directly. The projection layer
exists only to also accept plain-object mock sources, which is a trails
invention.

The cost is silent data loss: every flag needs its own hand-written projection
line, and a missing one fails open rather than loud. PR #5177 hit exactly this
— `virtualStored` was never projected, so `sqlite3/schema-dumper.ts:40` read
`column.virtualStored` as `undefined` and dumped _every_ SQLite generated
column as `stored: false`, producing a schema dump that would not round-trip.
Nothing caught it until a Rails-mirrored `test_schema_dumping` was ported.
`isEnum`, `isSerial`, `array`, `unsigned`, `extra` sit on the same footing.

## Acceptance criteria

- Audit the projection for other flags reachable on real `Column` objects but
  dropped on the way into `ColumnInfo` (compare against the fields each dialect
  dumper actually reads).
- Either pass real `Column` objects through to the dialect dumpers like Rails
  does, or make the projection total/type-checked so a newly-read flag cannot
  silently arrive `undefined`.
- Existing dumper suites (schema-dumper, sqlite3/mysql/pg dialect dumpers,
  comment, defaults) stay green.
