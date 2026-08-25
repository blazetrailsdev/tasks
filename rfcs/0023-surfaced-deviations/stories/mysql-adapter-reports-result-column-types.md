---
title: "MySQL adapter reports Result.columnTypes so computed/extra select columns cast faithfully"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 3773
claim: "2026-06-21T03:34:42Z"
assignee: "mysql-adapter-reports-result-column-types"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story `eager-load-extra-select-result-type-cast` (PR #3707),
which wired result `column_types` through every record-load path so extra/computed
`select` columns (absent from the schema) are type-cast at instantiation, mirroring
Rails' `JoinDependency#instantiate` / `Querying#_load_from_sql`
(`column_types = result_set.column_types` slice).

PostgreSQL already reports `column_types` (via its OID type map in
`postgresql/database-statements.ts` `castResult` — builds `columnTypes[i]` from
`getOidType`). SQLite returns native JS values. But the **MySQL adapter does not
populate `Result.columnTypes`**: `mysql2-adapter.ts` `execQuery`
(~line 524) and `mysql2/database-statements.ts` `castResult` (~line 208) build
`new Result(columns, rows)` with no third arg, and `performQuery` strips the
field descriptors down to `{ name }` (line ~175), discarding `field.type` /
`field.columnType`.

Consequence: a computed/aliased extra select on MySQL (e.g. `posts.id * 1.1 AS foo`)
comes back as the raw driver value — the string `"1.1"` for `NEWDECIMAL` — instead
of a `BigDecimal`. Rails' mysql2 gem casts decimals to `BigDecimal` at the driver
level, so `posts.first.foo` is a `BigDecimal` there. PR #3707's test passes on MySQL
only because it asserts `Number(post.readAttribute("foo")) === 1.1` (numeric
equality), which is true for the raw string too — masking the type-fidelity gap.

Note Rails' `Mysql2Adapter#cast_result` itself does NOT build `column_types` (it
relies on the gem's driver-level casting). node-mysql2 with `decimalNumbers:false`
returns decimals as strings, so trails has no equivalent driver cast — the faithful
fix is for the adapter to report `column_types` from `field.type` (numeric →
trails numeric `Type`), or to enable an equivalent driver/typeCast path that yields
a trails `BigDecimal`/number.

## Acceptance criteria

- [ ] The MySQL adapter reports `Result.columnTypes` for query results, at minimum
      for numeric/decimal field types, so extra/computed select columns deserialize
      to the faithful trails type (BigDecimal for `DECIMAL`/`NEWDECIMAL`, number for
      `FLOAT`/`DOUBLE`/integer types) instead of a raw driver string.
- [ ] `performQuery` / `castResult` preserve enough field metadata (`field.type`
      or `columnType`) to build the type map; map MySQL field type codes to trails
      `Type` instances (reuse `lookupCastType` / the adapter type map where possible).
- [ ] Tighten `relation/select.test.ts > type casted extra select with eager loading`
      (and/or add coverage) so the extra column's type is asserted faithfully on MySQL
      (BigDecimal), not just via `Number(...)` numeric coercion.
- [ ] No regressions in existing MySQL adapter / decimal / hydration tests.
