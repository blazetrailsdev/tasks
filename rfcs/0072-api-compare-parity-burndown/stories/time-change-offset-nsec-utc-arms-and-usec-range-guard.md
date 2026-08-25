---
title: "time-change-offset-nsec-utc-arms-and-usec-range-guard"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6246
claim: "2026-08-08T16:39:55Z"
assignee: "time-change-offset-nsec-utc-arms-and-usec-range-guard"
blocked-by: null
closed-reason: null
---

## Context

`Time#change` raises before it builds anything when the requested sub-second
component is out of range:

```ruby
# vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:135
raise ArgumentError, "argument out of range" if new_usec >= 1000000
```

It also carries two option arms `time-ext.ts`'s `change` does not port at all:

- `:132` `new_offset = options.fetch(:offset, nil)`, and the `if new_offset`
  arm at `:145-146` that builds `::Time.new(..., new_offset)`.
- `:134-140` the `:nsec` option, including its
  `ArgumentError` naming both keys (the message interpolates
  `options.inspect`) when `:usec` is passed alongside it, and
  `new_usec = Rational(new_nsec, 1000)`.
- `:147-148` the `elsif utc?` arm building through `::Time.utc`.

PR #6198 gave `change` its zone arms (`:150-174`) and left these untouched —
they were absent before that PR too, so it is pre-existing debt, not a
regression. Flagged in review on #6198.

`ChangeOptions` in `packages/activesupport/src/time-ext.ts` currently declares
`year/month/day/hour/min/sec/usec` only, so `:offset` and `:nsec` are not even
expressible.

## Acceptance criteria

- [ ] `change` raises `ArgumentError` with the message `"argument out of range"`
      when `newUsec >= 1000000`, at Rails' raise site (`:135`).
- [ ] `ChangeOptions` carries `offset` and `nsec`, and `change` ports the
      `if new_offset` (`:145-146`), `:nsec`/`:usec` conflict raise
      (`:134-137`) and `elsif utc?` (`:147-148`) arms in Rails' branch order.
- [ ] Existing callers (`beginningOfDay`, `endOfDay`, `endOfHour`,
      `endOfMinute`, `advance`) stay green — they pass
      `usec: 999999999 / 1000`, which is below the range guard.
- [ ] `pnpm parity:api:calls` green.
