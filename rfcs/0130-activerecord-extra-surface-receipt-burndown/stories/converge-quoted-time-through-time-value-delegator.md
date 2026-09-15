---
title: "Converge quotedTime onto value.change through the Type::Time::Value delegator"
status: done
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: trails#7813
claim: "2026-09-15T17:51:21Z"
assignee: "converge-protocol-adapters-inheritable-options"
blocked-by: null
closed-reason: null
---

## Context

Surfaced after trails#7783 converged `Type::Time::Value` onto `DelegateClass(RubyTime)`.

Rails' `quoted_time` never unwraps the value: `value = value.change(year: 2000, month: 1, day: 1)` reaches the wrapped `::Time` through the delegator
(`activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:201-204`, `sqlite3/quoting.rb:74-77`).

trails' `quotedTime` in `packages/activerecord/src/connection-adapters/abstract/quoting.ts` and `sqlite3/quoting.ts` opens with
`if (value instanceof TimeValue) value = value.__getobj__()`, then branches on `RubyTime` / `TimeWithZone` / `Temporal.PlainTime` to convert to a `PlainDateTime`.
The unwrap is load-bearing because `DelegateClass(RubyTime)` shares `RubyTime.prototype`. A `Value` wrapping a `TimeWithZone` is therefore `instanceof RubyTime`, and without the unwrap it would take the wrong branch.

## Acceptance criteria

- Both `quotedTime` bodies are `value.change({ year: 2000, month: 1, day: 1 })` followed by `quotedDate(value)` with the date prefix substituted, as in Rails. There is no `TimeValue` unwrap and no per-type branch.
- `change` is reached through the `Value` delegator.
- The sqlite3 quoting and type/time tests pass on all adapters.
