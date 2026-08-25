---
title: "SQLite bind keys INTEGER/FLOAT off value, not attribute type (whole-float binds as INTEGER)"
status: done
updated: 2026-07-09
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 29
pr: 4803
claim: "2026-07-08T21:22:34Z"
assignee: "sqlite-float-bind-value-vs-type-heuristic"
blocked-by: null
closed-reason: null
---

## Context

PR #4763 (sqlite-integer-bind-serializes-as-float) fixed integer binds
serializing as `SQLITE_FLOAT` by converting integer-valued JS numbers to
`BigInt` in the SQLite type cast
(`packages/activerecord/src/connection-adapters/sqlite3/quoting.ts`
`typeCast`, number branch). Because JS has no integer/float distinction, the
conversion keys off the _value_ (`Number.isInteger(value)`), whereas MRI keys
the `SQLITE_INTEGER`/`SQLITE_FLOAT` choice off the Ruby object _class_
(`Integer` vs `Float`) set by the type-cast layer
(`activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb`
`_type_cast` / `abstract/quoting.rb`).

Consequence (documented as a "fidelity boundary" in the code comment): a
whole-valued Float/decimal bind — e.g. a `2.0` from a float or decimal column —
binds as `SQLITE_INTEGER` rather than `SQLITE_FLOAT`. Observable only through a
text-forcing function on a numeric column (`LOWER(2.0)` → `'2'` not `'2.0'`),
which AR does not generate for numeric columns after PR #4763 removed the
`caseInsensitiveComparison` override; normal numeric comparisons coerce and are
unaffected. No known failing test today.

## Acceptance criteria

- Thread the bind's attribute/column type (Integer vs Float/Decimal) into the
  SQLite bind path (`_driverBind` / `typeCast`) so the INTEGER/FLOAT choice
  matches MRI's type-based dispatch rather than the value-based
  `Number.isInteger` heuristic.
- A whole-valued Float/Decimal bind serializes as `SQLITE_FLOAT`
  (`typeof(?) => 'real'`, `LOWER(?) => '2.0'`); an Integer bind stays
  `SQLITE_INTEGER`.
- No regression to PR #4763's integer/boolean bind fidelity or the
  `numeric-data` round-trip tests.

## Out of scope

- The integer/boolean bind fix itself (shipped in #4763).
