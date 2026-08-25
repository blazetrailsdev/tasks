---
title: "Date#ago/since/beginning_of_day widen through in_time_zone"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6197
claim: "2026-08-07T19:52:41Z"
assignee: "relation-proxy-respond-to-missing"
blocked-by: null
closed-reason: null
---

## Context

PR #6190 converged `packages/activesupport/src/time-ext.ts` onto the
decomposition Rails' `core_ext/*/calculations.rb` reopenings use, shrinking
`scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json` from
25 rows to 8. Five of the eight survivors are one class: the `Date` arm's
`in_time_zone` widening.

Rails keeps `Date` and `Time` as separate receivers, and `Date`'s calculations
widen into a zoned `Time` before delegating:

- `vendor/rails/activesupport/lib/active_support/core_ext/date/calculations.rb:55-57`
  — `def ago(seconds) = in_time_zone.since(-seconds)`
- `:61-63` — `def since(seconds) = in_time_zone.since(seconds)`
- `:67-69` — `def beginning_of_day = in_time_zone`
- `:75-77` — `def middle_of_day = in_time_zone.middle_of_day`
- `:85-87` — `def end_of_day = in_time_zone.end_of_day`

`time-ext.ts` is a single free-function module that takes a JS `Date` — always
an instant — and `RUBY_FILE_TS_OVERRIDES` points all three reopenings
(`time/`, `date/`, `date_time/calculations.rb`) at it. So there is no
Date-to-Time widening step for these bodies to delegate to, and the ported
bodies are the `Time` arm only. The five rows record that the `Date` arm is
absent, not that a body dropped a call.

## Converged shape

Split the `Date` receiver from the `Time` receiver so `in_time_zone` has
something to widen. Rails' `Date#beginning_of_day` answers a `TimeWithZone`,
not an instant, and the package already has `TimeWithZone` plus a
`Temporal.PlainDate` (`toDate`) to hang the `Date` arm on — see RFC
0088-date-gem-port, whose `converge-time-with-zone-strftime-onto-date-package`
and `time-with-zone-nsec-truncates-to-milliseconds` landed the pieces.

Concretely: give the `Date` arm its own bodies keyed on `Temporal.PlainDate`
that call `inTimeZone()` and then delegate to the `Time` arm, and repoint
`activesupport:core_ext/date/calculations.rb` in
`scripts/api-compare/conventions.ts` at that file instead of `time-ext.ts`.

## Acceptance criteria

- [ ] `Date#ago` / `since` / `beginning_of_day` / `middle_of_day` / `end_of_day`
      exist on a `Date`-receiver surface and delegate through `inTimeZone`,
      matching `date/calculations.rb:55-87`.
- [ ] The five `in_time_zone` rows are DELETED from
      `call-mismatches-exclude/activesupport/time-ext.json` by hand (only-shrink;
      no `--write` reseed).
- [ ] `pnpm parity:api:calls` green; `pnpm parity:api` / `pnpm parity:test` deltas
      non-negative.
- [ ] No test renames.
