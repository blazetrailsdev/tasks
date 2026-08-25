---
title: "converge-duration-constructor-value-seat"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6693
claim: "2026-08-18T12:46:51Z"
assignee: "converge-duration-constructor-value-seat"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Duration` in Rails carries its total seconds in a dedicated
constructor seat: `initialize(value, parts, variable = false)`
(`activesupport/lib/active_support/duration.rb:280-287`), and every factory
fills it — `seconds(value)` is `new(value, { seconds: value }, false)`
(`duration.rb:155-157`), `minutes`, `hours`, `days`, `weeks`, `months`, `years`
likewise (`duration.rb:159-181`), and `parse` is
`new(calculate_total_seconds(parts), parts)` (`duration.rb:144-147`).

trails' `Duration` constructor is `(parts, variable)`
(`packages/activesupport/src/duration.ts:101`) and derives the total itself, so
none of those call sites can pass what Rails passes. That single ctor
divergence is what keeps three baseline rows alive in
`scripts/api-compare/call-mismatches-exclude/activesupport/duration.json`:

- `seconds -> new` (`kind: "args"`, `rubyArgs: ["ref:value", "kwargs{seconds=ref:value}", "bool:false"]`)
- `parse -> calculate_total_seconds` (call-set row: the total has no argument seat to fill)
- `coerce -> new` (`naming`, `ref:value` vs `ref:inSeconds`)

Converging is a `duration.ts`-wide change (ctor seat + every factory + the
`value` reader) plus its callers, which is why the RFC 0106 non-ActiveRecord
burndown left it: it is not an argument-list edit at one site.

Surfaced by `converge-remaining-call-arg-shape-rows-activesupport-rack-i18n`.

## Acceptance criteria

- [ ] `Duration`'s constructor takes Rails' `(value, parts, variable)` seats and
      the factories pass what `duration.rb:155-181` passes.
- [ ] The three rows above are DELETED from the exclude shard by hand
      (only-shrink, no reseed; `parity:api:calls:tighten` for a stale mark).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
