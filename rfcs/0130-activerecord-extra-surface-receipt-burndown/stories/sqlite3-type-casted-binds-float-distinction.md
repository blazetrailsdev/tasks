---
title: "sqlite3-type-casted-binds-float-distinction"
status: closed
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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
closed-reason: "converged in trails#8001: SQLite3 typeCastedBinds deleted, float bind choice moved into perform_query"
---

## Context

Split out of `relocate-misfiled-permanent-adapter-receipts`. `SQLite3Adapter#typeCastedBinds`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, `@noRailsEquivalent PERMANENT`)
overrides a name Rails defines only in `activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:224-232`
(`type_casted_binds`), so the PERMANENT receipt is false and the member scores `moved`.

It cannot simply be deleted in favour of the inherited body. The override routes each bind through
`_driverBind`, which passes `bindsAsFloat = value.type instanceof FloatType` into
`sqlite3/quoting.ts#typeCast`. That flag exists because JS has one `number`: MRI's sqlite3 gem picks
SQLITE_INTEGER vs SQLITE_FLOAT from the Ruby object's class (`Integer` vs `Float`), which the type layer
set; trails' `typeCast` BigInts any integer-valued number, so without the flag a whole-valued Float/Decimal
bind (`2.0`) binds as INTEGER (`LOWER(2.0)` -> `'2'`). Regression tests from #4803
("binds a whole-valued Float attribute as SQLITE_FLOAT", "... Decimal ...") pin this.

Rails' `sqlite3/quoting.rb:112-124` `type_cast` sees only the value, so converging means carrying the
Integer/Float distinction on the value that reaches `type_cast` (the `value_for_database` of a Float/Decimal
attribute), not on the adapter's `type_casted_binds`.

## Acceptance criteria

- `SQLite3Adapter#typeCastedBinds` and `_driverBind` are deleted; the adapter inherits
  `abstract/quoting.ts#typeCastedBinds` (abstract/quoting.rb:224).
- `sqlite3/quoting.ts#typeCast` drops its invented `bindsAsFloat` parameter (sqlite3/quoting.rb:112 takes `value` only).
- The #4803 Float/Decimal/Integer `typeof(?)` binding tests stay green.
- `pnpm parity:api:extra:gate` stays green with activerecord rowless.
