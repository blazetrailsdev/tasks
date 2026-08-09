---
title: "PG renders int8 as a String, forcing a Number() coercion Rails does not have"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6265
claim: "2026-08-09T00:15:03Z"
assignee: "date-parse-union-return-is-ts-static-side-variance"
blocked-by: null
closed-reason: null
---

## Context

`select_values` in trails hands back the driver's raw value — `selectRows` maps
`row[0]` off `selectAll().rows` with no type cast
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`,
`selectValues` / `selectRows`). On PostgreSQL, node-postgres renders `int8`
(OID 20) as a **String** unless a type parser is registered, and no parser is
registered anywhere in `packages/activerecord`.

`count(*)` is `int8`, so every `select_values`-based count answers `"3"` rather
than `3` on PG and a number on sqlite/mysql. PR #6262 pinned this: the
`Number(...)` coercion in `SchemaMigration#count` / `InternalMetadata#count`
(`schema_migration.rb:91-98`, `internal_metadata.rb:64-71`) could not be deleted
as dead code because of it, and now carries a call-site justification naming
this adapter.

Rails has no such coercion — `connection.select_values(...).first` is the whole
body — because the pg gem's own type map already decodes int8 to an Integer.
So the divergence is in trails' PG result decoding, not in the callers, and
every other `select_values` consumer of a numeric column inherits it silently.

## Converged shape

The PG adapter decodes `int8` to a JS number on the way out, the way the pg
gem's type map does, so `select_values` answers the same type on every adapter.
Then the `Number(...)` coercion in both `count` bodies is genuinely dead and can
be deleted, converging those two bodies fully onto Rails' `.first`.

Mind the range: `int8` exceeds `Number.MAX_SAFE_INTEGER`, so the decode needs the
same safe-range treatment `IntegerType#castValue` already applies (see
`project_integertype_castvalue_bigint_safe_range_only`) rather than a bare
`Number()`.

## Acceptance criteria

- [ ] `selectValues` answers a number for `COUNT(*)` on PG, matching sqlite/mysql.
- [ ] The `Number(...)` coercion and its call-site justification are removed from
      both `count` bodies.
- [ ] Out-of-safe-range `int8` values are handled, not silently truncated.
- [ ] Green on PG and MariaDB.
