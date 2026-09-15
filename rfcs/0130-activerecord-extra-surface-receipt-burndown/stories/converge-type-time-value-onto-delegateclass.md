---
title: "Converge Type::Time::Value onto DelegateClass(::Time)"
status: ready
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`ActiveRecord::Type::Time::Value` is `class Value < DelegateClass(::Time)`
(activerecord/lib/active_record/type/time.rb:8-9). trails#7761 renamed its hand-written
`getobj()` to `__getobj__()`, but `packages/activerecord/src/type/time.ts:6-12`
still declares a plain class holding a private `obj` with a hand-written
`__getobj__`, rather than using `DelegateClass` from
`packages/ruby-compat/src/delegate.ts`. Callers
(`connection-adapters/abstract/quoting.ts:327`,
`connection-adapters/sqlite3/quoting.ts:88`, `type/time.ts:47`) unwrap it by hand.

The obstacle: the wrapped value may be `Temporal.Instant | TimeWithZone | RubyTime`,
whereas Rails only wraps `::Time` (`serialize` wraps `when ::Time`, time.rb:11-17).

## Acceptance criteria

- `Value` is `DelegateClass(RubyTime)` (or the ruby-compat equivalent), with `__getobj__`
  inherited rather than declared.
- `Time#serialize` wraps only a Ruby Time value, as time.rb:11-17 does.
- Quoting callers keep working; type/time tests pass on all adapters.
