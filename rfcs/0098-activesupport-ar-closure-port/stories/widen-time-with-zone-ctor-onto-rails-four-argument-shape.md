---
title: "Widen TimeWithZone's constructor onto Rails' four-argument shape and port its helpers"
status: claimed
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: ["port-time-zone-local-period-lookups"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-08-21T14:50:39Z"
assignee: "add-leading-underscore-call-candidate-to-conventions"
blocked-by: null
closed-reason: null
---

## Context

`TimeWithZone`'s constructor diverges from Rails, and four private helpers that
hang off it are unported.

Rails (`time_with_zone.rb:51-56`):

```ruby
def initialize(utc_time, time_zone, local_time = nil, period = nil)
  @utc = utc_time ? transfer_time_values_to_utc_constructor(utc_time) : nil
  @time_zone, @time = time_zone, local_time
  @period = @utc ? period : get_period_and_ensure_valid_local_time(period)
end
```

trails (`time-with-zone.ts:100-103`):

```ts
constructor(instant: Temporal.Instant, timeZone: TimeZone) {
  this._zoned = instant.toZonedDateTimeISO(timeZone.tzinfo);
  this._timeZone = timeZone;
}
```

Missing members, all verified absent from `packages/activesupport/src`:
`incorporate_utc_offset`, `get_period_and_ensure_valid_local_time`,
`transfer_time_values_to_utc_constructor`, `wrap_with_time_zone`.

The two-argument shape is why Rails' local-time construction path has no
counterpart: Rails can be handed a LOCAL time with no UTC value and derive the
period from it (`get_period_and_ensure_valid_local_time`), which is also where
it raises on a nonexistent local time. trails can only be handed an `Instant`,
so that arm does not exist and the raise never fires.

## Why this is now portable

The blocking premise — "needs the decision on whether TimeZone grows
`period_for_utc` / `periods_for_local` and a Period type" — is answered:
`TimezonePeriod` exists (`values/time-zone.ts:543`), `periodForUtc` exists
(`:1076`), and the local-side lookups land in
`port-time-zone-local-period-lookups`, which this story depends on.

## Migration shape

The two added parameters are **optional and trailing**, so this is additive:
25 non-test `new TimeWithZone(` call sites keep compiling unchanged
(`grep -rn 'new TimeWithZone(' packages/*/src --include='*.ts' | grep -v '\.test\.'`).
Do not "simplify" the first parameter — Rails' `utc_time` and trails' `instant`
occupy the same slot, and widening the accepted type is part of the port, not a
separate refactor.

## Acceptance criteria

- [ ] The constructor takes Rails' four arguments in Rails' order, with Rails'
      defaults, and its body is Rails' three assignments — including the
      `@utc ? period : get_period_and_ensure_valid_local_time(period)` branch.
- [ ] All four private helpers ported at their Rails names, bodies matching
      `time_with_zone.rb`.
- [ ] `getPeriodAndEnsureValidLocalTime` raises on a nonexistent local time the
      way Rails does, with the same error class and message, and a test covers it.
- [ ] The 25 existing two-argument call sites are untouched and still compile.
- [ ] `pnpm parity:api` AR-closure rollup rises by 4.
- [ ] `pnpm parity:api:calls` / `:args` green; no new baseline rows.
