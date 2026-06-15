---
title: "PG newColumnFromField stores deserialized column default (Rails stores raw); before_type_cast deviates"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while landing `decimaltype-cast-returns-string-not-bigdecimal` (#3281).

`PostgreSQLAdapter#newColumnFromField`
(`postgresql-adapter.ts`, ~line 5229) stores
`castType.deserialize(rawLiteral)` as the column's `default`. Rails'
`new_column_from_field` stores the **raw** value from
`extract_value_from_default` and defers deserialization to
`Attribute.from_database`. Because trails pre-deserializes, `column.default`
holds the cast value, so `*_before_type_cast` for a column default returns the
cast value rather than the raw literal.

This was masked while `DecimalType#cast` returned a string (the cast string
equalled the raw string). With decimals now casting to `BigDecimal`, the
deviation is visible: `PostgresqlMoney.new.depth_before_type_cast` returns a
`BigDecimal` where Rails returns the String `"150.55"` (see the note in
`adapters/postgresql/money.test.ts` "default" and the decimal-column assertion
in `adapters/postgresql/schema.test.ts`).

Note: changing `newColumnFromField` to store the raw literal affects
`column.default` for **every** column type (integers, booleans, etc.), so it
needs its own scoped change + full PG/MySQL schema-test pass, not a fold-in.

## Acceptance criteria

- PG (and MySQL, if it shares the pattern) `newColumnFromField` stores the raw
  default literal; deserialization happens in `Attribute.from_database`.
- `*_before_type_cast` for column defaults returns the raw String, matching
  Rails (restore the literal assertions in `money.test.ts` "default" and
  `schema.test.ts` decimal-default).
- `column_defaults` / cast reads still return the deserialized value.
- PG + MySQL schema/default/column test suites stay green.
