---
title: "PG OID::Range#typeCastForSchema uses a local instanceof inspect ladder instead of value.inspect"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8079 (instanceof-time-sites-assume-twz-is-not-a-time). Rails'
`OID::Range#type_cast_for_schema`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/range.rb:15-17`)
is `value.inspect.gsub("Infinity", "::Float::INFINITY")`, so it uses the value's own `inspect`.

trails (`packages/activerecord/src/connection-adapters/postgresql/oid/range.ts`) routes
through a file-local `inspect(value)` helper, which is an `instanceof` ladder:

- `TimeWithZone#inspect`, as of #8079
- `Time#toS`, which is not `Time#inspect`: Ruby's `Time#inspect` keeps the subsec digits
- `Temporal.*#toString`
- a JS `Date` rejection
- a fallback to `String(value)`, which for a `Range` is not Ruby's `Range#inspect`

## Converged shape

`typeCastForSchema` calls `rbInspect(value)` (ruby-compat, which dispatches to the value's
own `inspect`), and the local helper is deleted. `@blazetrails/date`'s `Time` needs an
`inspect` port (`vendor/ruby/time.c` `time_inspect`) if it lacks one.

## Acceptance criteria

- No file-local `inspect` in `range.ts`. `typeCastForSchema` renders `value.inspect` for Range, Time, TimeWithZone and numeric bounds.
- A test per value kind compares against the Ruby `inspect` output.
