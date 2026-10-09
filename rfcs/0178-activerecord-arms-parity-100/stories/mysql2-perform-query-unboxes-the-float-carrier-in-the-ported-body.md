---
title: "activerecord: mysql2 performQuery unboxes the Float carrier and converts temporals in the ported body"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8708. `Quoting#typeCast` now returns a boxed `Number`, the carrier for a Ruby Float, from Rails' `when nil, Numeric, String then value` arm (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:103`), and each driver unboxes it at bind. The SQLite wrappers (`packages/activerecord/src/sqlite/*.ts`, `bindParams`) and the pg connection (`packages/activerecord/src/pg/connection.ts`, `execParams` / `execPrepared`) do it in files with no Rails counterpart.

mysql2 has no wrapper: `rawConnection` is the npm client itself. So the unboxing sits in the `driverBinds` map of `performQuery` (`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts`), a ported body, as `value instanceof Number ? value.valueOf() : value`. Rails' `perform_query` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb`) has no such arm; the mysql2 gem converts a Float inside its C bind. `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows the method at eight invented `if`s, one more than before that PR.

The same `driverBinds` map already converts `TimeWithZone`, `Time` and `Temporal.PlainDate` through `quotedDate`, for the same reason.

## Acceptance criteria

- [ ] The Float unboxing and the temporal conversions happen in a mysql2 client wrapper, as the SQLite and pg ones do, and `performQuery` hands `typeCastedBinds` over unchanged.
- [ ] The invented-direction row for `mysql2/database-statements.ts#performQuery` loses the arms that map carried.
- [ ] A whole-valued Float bound to a `DOUBLE` column round-trips on the MariaDB lane.
