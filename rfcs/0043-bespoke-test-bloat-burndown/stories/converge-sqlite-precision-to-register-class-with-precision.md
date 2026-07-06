---
title: "converge-sqlite-precision-to-register-class-with-precision"
status: in-progress
updated: 2026-07-06
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4681
claim: "2026-07-06T15:41:00Z"
assignee: "converge-sqlite-precision-to-register-class-with-precision"
blocked-by: null
closed-reason: null
---

## Context

Sibling to `converge-sqlite-limit-to-register-class-with-limit` (PR #4679),
which converged sqlite's **limit** threading onto Rails'
`register_class_with_limit` (limit resolved at type-map lookup time via
`extractLimit`). That PR deliberately left the **precision** side unconverged,
and its comments now document the asymmetry
(`sqlite3-adapter.ts` `fetchTypeMetadata` ~line 1168-1173 and the note at
~1208-1210).

Today sqlite still resolves temporal precision the old way:
`fetchTypeMetadata` strips the `(N)` off `datetime`/`time`/`timestamp` and
stores the paren-stripped base as `sqlType`; the precision is then bolted back
on afterward inside the `lookupCastTypeFromColumn` override
(`sqlite3-adapter.ts` ~1225-1229, the `SQLiteDateTimeType`/`TimeType`
`instanceof` branch). This is needed because sqlite registers
`"datetime"`/`"time"`/`"timestamp"` as **exact-string** type-map keys
(`initializeTypeMap`, ~lines 3064-3067), so a raw `datetime(6)` never reaches a
precision-parsing factory.

Rails needs no such override: `SQLite3Adapter`'s type map is built on
`AbstractAdapter#initialize_type_map` via `super`, which registers
date/time/datetime with `register_class_with_precision`
(`abstract_adapter.rb:894-896`, `868-873`); precision resolves through the same
lookup-time mechanism as limit, and `lookup_cast_type_from_column` is just
`lookup_cast_type(column.sql_type)` with no override
(`abstract/quoting.rb:125-127`). trails already has the
`registerClassWithPrecision` static helper
(`abstract-adapter.ts:2032-2045`) — the exact analog.

## Acceptance criteria

- Register sqlite's `datetime`/`time`/`date` (and the `timestamp` alias) as
  regex precision factories via `registerClassWithPrecision`, using the
  sqlite-specific types (`SQLiteDateTimeType`, `TimeType`, `DateType`) so a raw
  `datetime(6)` resolves to the right cast type WITH precision at lookup time.
  Mind reverse-registration ordering so `datetime` is matched before `time`
  (`/time/i` also matches `"datetime"`); mirror the base-map ordering
  (date, time, datetime, then timestamp alias).
- `fetchTypeMetadata` stores the full un-stripped `sql_type` for temporal types
  too (dropping the `isDtPrec` paren-stripping special case), matching Rails'
  `fetch_type_metadata` which carries the whole `sql_type`.
- Remove the sqlite `lookupCastTypeFromColumn` override entirely (or reduce it
  to `lookup_cast_type(column.sqlType)`), deleting the
  `SQLiteDateTimeType`/`TimeType` precision-reconstruction branch — precision
  now flows through the factory like limit does.
- No regression in `date-time-precision.test.ts`, `schema-dumper*.test.ts`
  (datetime precision dump), sqlite introspection/copy-table, or
  api:compare / test:compare delta. Note copy_table (`sqlite3-adapter.ts`
  ~2682) reads the raw `sqlType`; carrying `datetime(6)` there is a fidelity
  improvement, verify the copy-table suite stays green.

Hard rules: no `node:*`/`process.*` in src; async fs only; no new runtime deps;
500 LOC ceiling; single PR from main; test names match Rails verbatim.
