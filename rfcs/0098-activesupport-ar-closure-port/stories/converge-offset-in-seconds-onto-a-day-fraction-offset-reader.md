---
title: "DateTime#offset_in_seconds should read a day-fraction offset, not offsetNanoseconds"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6556
claim: "2026-08-15T00:45:07Z"
assignee: "adapter-non-boolean-prepared-statements-config-raises"
blocked-by: null
closed-reason: null
---

## Context

PR #6550 ported `DateTime#offset_in_seconds`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_time/conversions.rb:99-101`)
into `packages/activesupport/src/time-ext.ts` and shipped a call-mismatch
baseline row for it:

```text
activesupport  time-ext.ts  offset_in_seconds  offset
```

Rails' body is one expression:

```ruby
def offset_in_seconds
  (offset * 86400).to_i
end
```

`offset` there is ruby/date's `DateTime#offset` — a `Rational` fraction of a
day (`+05:00` is `Rational(5, 24)`), which is why Rails multiplies by 86400.
The trails receiver is `Temporal.PlainDateTime | Temporal.ZonedDateTime`, whose
own `.offset` is a `"+05:00"` **string**, so the port reads
`offsetNanoseconds / 1_000_000_000` instead and the call-set gate sees the
`offset` call as missing.

This is a library-shape difference, not a TypeScript language shortcoming, so
the row is debt rather than a ratified deviation.

## Converged shape

Give the receiver an `offset` reader that answers Ruby's value — the day
fraction — so `offsetInSeconds` can be `offset(datetime) * 86400` truncated,
exactly as the Ruby reads. The natural home is `@blazetrails/date` next to the
other ruby/date `DateTime` readers (`packages/date/src/date.ts`), since
`offset` is ruby/date's method rather than ActiveSupport's; trails already has
`Rational` there (`packages/date/src/rational.ts`) to carry the exact value.

Then delete the row from
`scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json` and
run `pnpm parity:api:calls:tighten activesupport/time-ext.json`.

Note this likely lands with, or after,
[[port-date-time-calculations-onto-its-own-receiver]] — both turn on giving
`DateTime` a receiver of its own rather than sharing `time-ext.ts`.

## Acceptance criteria

- [ ] `offsetInSeconds` reads a day-fraction `offset` off the receiver and
      multiplies by 86400, matching `conversions.rb:99-101` expression for
      expression.
- [ ] The `offset_in_seconds` / `offset` row is deleted from
      `call-mismatches-exclude/activesupport/time-ext.json` (only-shrink: delete
      the one row by hand, do not reseed).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` clean;
      `pnpm parity:api` delta non-negative.
