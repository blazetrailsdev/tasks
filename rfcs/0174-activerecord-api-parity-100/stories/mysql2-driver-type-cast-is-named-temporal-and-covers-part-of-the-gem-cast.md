---
title: "activerecord: mysql2 driver typeCast is named temporal and covers part of the gem's row cast"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8324 moved the numeric half of the mysql2 gem's row cast into node-mysql2's `typeCast` hook:
`packages/activerecord/src/connection-adapters/mysql/temporal-type-cast.ts` `temporalTypeCast` now casts
`DECIMAL` / `NEWDECIMAL` (to `BigDecimal`, or an integer at scale 0) and `LONGLONG` beside the temporal
types. The function, its file, its test file and `TEMPORAL_POOL_OPTIONS`
(read by `connection-adapters/mysql2-adapter.ts` `newClient`) still say "temporal".

The function stands in for the gem's result reader, which
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:119`
relies on when it builds `Result.new(fields, raw_result.to_a)` with no column types.

Two gaps against the gem's cast remain in the same function: `TIME` is left to the driver default (the gem
returns a `Time`), and `TINY`/`SHORT`/`LONG`/`INT24`/`YEAR`/`FLOAT`/`DOUBLE` rely on the driver's own
number parse rather than an explicit arm.

## Acceptance criteria

- [ ] The module, function, options constant and test file carry a name that covers every type it casts; `Mysql2Adapter.newClient` reads the renamed option.
- [ ] Each MySQL field type the mysql2 gem casts has an explicit arm or a recorded reason the driver default already equals the gem's value.
- [ ] MariaDB lane green, including the prepared-statements variant.
