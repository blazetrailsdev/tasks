---
title: "converge-incorporate-utc-offset-date-arm-onto-kernel-rational"
status: draft
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while auditing the remaining `Kernel#Rational()` call sites in PR
#7316 (`converge-remaining-kernel-rational-call-sites`, RFC 0129).

`TimeWithZone#incorporate_utc_offset`'s Date arm is

```ruby
def incorporate_utc_offset(time, offset)
  if time.kind_of?(Date)
    time + Rational(offset, SECONDS_PER_DAY)
  else
    time + offset
  end
end
```

(`vendor/rails/activesupport/lib/active_support/time_with_zone.rb:562-568`).

trails spells that arm as plain `Temporal.PlainDateTime` second arithmetic:

```ts
if (time instanceof Temporal.PlainDate) {
  return this._transferTimeValuesToUtcConstructor(
    time.toPlainDateTime().add({ seconds: offset }),
  );
}
```

(`packages/activesupport/src/time-with-zone.ts:241-248`).

Unlike the other sites #7316 converged, this is not a spelling difference the
`rational()` export closes: Rails advances a `Date` by a DAY FRACTION through
`Date#+`, and trails advances a wall clock by seconds. The two agree on the
values this path sees today, which is why the JSDoc at `:233-239` explains the
elision rather than converging it — but the elision is a deviation, and RFC
0129's charter is that a Rails `Rational()` call is spelled as one.

`SECONDS_PER_DAY` (`time_with_zone.rb:560`) is already ported at
`time-with-zone.ts:107`, and `@blazetrails/date`'s `Date#plus` takes a
`Rational`, so the shape exists — this is a behaviour-carrying change to the
DST-gap retry path (`_getPeriodAndEnsureValidLocalTime`, `:266`), which is why
it is filed rather than folded into a spelling PR.

## Acceptance criteria

- `_incorporateUtcOffset`'s Date arm is `RubyDate#plus(rational(offset,
  SECONDS_PER_DAY))`, mirroring `time_with_zone.rb:564`, and the JSDoc
  explaining the elision is deleted rather than reworded.
- The `else` arm stays `time.plus(offset)` (`:566`).
- `packages/activesupport/src/time-with-zone.test.ts` and the DST-gap cases in
  `time-zone.test.ts` are green, and `pnpm parity:api:calls`,
  `parity:api:calls:args` show no new rows.
