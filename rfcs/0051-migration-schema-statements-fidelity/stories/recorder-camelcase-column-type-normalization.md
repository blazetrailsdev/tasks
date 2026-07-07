---
title: "recorder-camelcase-column-type-normalization"
status: claimed
updated: 2026-07-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 36
pr: null
claim: "2026-07-07T03:05:33Z"
assignee: "recorder-camelcase-column-type-normalization"
blocked-by: null
---

## Context

`withAdapterColumnMethods` (`packages/activerecord/src/migration/command-recorder.ts:807`)
records the accessed property name (`prop`) verbatim as the column type:
`col.column(name, prop, options)`. For single-token shorthands this matches
Rails, but trails uses camelCase TableDefinition method names, so multi-word
shorthands record the camelCase token rather than Rails' snake symbol.

Surfaced by the columnMethodNames() MySQL/SQLite parity work
(adapter-columnmethodnames-mysql-sqlite-parity, PR #3565), which adds
`unsignedInteger`/`unsignedBigint`/`unsignedFloat`/`unsignedDecimal` (MySQL)
and expands PG's `bitVarying`. Calling `t.unsignedInteger("x")` inside a
`change_table` block records `{ cmd: "addColumn", args: [..., "unsignedInteger", {}] }`,
but Rails' `define_column_methods` generates
`def unsigned_integer(...); column(name, :unsigned_integer, ...)` — i.e. the
recorded/replayed type should be the snake_case `unsigned_integer`
(matching the real MySQL `TableDefinition#unsignedInteger`, which calls
`this.column(name, "unsigned_integer", ...)`).

Rails refs:

- `abstract/schema_definitions.rb:332` define_column_methods generator
- `mysql/schema_definitions.rb:255` (trails) maps unsignedInteger -> "unsigned_integer"

## Acceptance criteria

- [ ] The `change_table` recorder proxy records the same column type Rails'
      `define_column_methods` would (snake_case), not the camelCase JS method
      name, for multi-word shorthands (`unsignedInteger` -> `unsigned_integer`,
      `bitVarying` -> `bit_varying`).
- [ ] Single-token shorthands (serial, bigserial, jsonb, ...) unchanged.
- [ ] Round-trip recording test updated to assert the snake_case recorded type.
