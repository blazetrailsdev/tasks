---
title: "::Time truncates to whole seconds, so #nsec and %N always answer zero"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6156
claim: "2026-08-06T14:43:07Z"
assignee: "ruby-time-carries-no-fractional-seconds"
blocked-by: null
closed-reason: null
---

## Context

trails' `::Time` carries whole seconds only, so `%N` and `%L` always answer
zeros. `packages/date/src/time.ts:265-280` passes a literal:

```ts
nsec: 0,
```

because there is nothing else to pass: the constructor
(`time.ts:...`, `Time.new(year, month, day, hour, min, sec, zone)`) puts `sec`
straight into a `Temporal.PlainDateTime` positional slot and keeps no
sub-second state.

MRI's `::Time` carries a fractional second as a Rational — `Time.new` takes a
Float or Rational `sec`, and `#nsec` / `#usec` / `#subsec` answer it:

```ruby
Time.utc(2008, 3, 1, 6, 0, 0.5).strftime("%N")  # => "500000000"
Time.utc(2008, 3, 1, 6, 0, 0.5).nsec            # => 500000000
```

Surfaced by PR #6147, which folded `%N` and `%L` into the shared formatter
(`packages/date/src/date.ts`) from `TimeWithZone`'s deleted token table. The
formatter reads `subject.nsec` and pads to nine digits, so it is ready; both
`::Time` and `::DateTime` are the callers that can only hand it `0`.

Related: [[time-with-zone-nsec-truncates-to-milliseconds]] is the same directive
losing precision one layer up, for a different reason (there the nanoseconds
exist and are discarded; here they are never captured).

## Converged shape

`::Time` holds sub-second state. `Temporal.PlainDateTime` already has
`millisecond` / `microsecond` / `nanosecond` slots, so the constructor splits a
fractional `sec` into them rather than truncating, and `#nsec` / `#usec` /
`#subsec` read them back. `#strftime` then passes the real `nsec`.

## Acceptance criteria

- [ ] `Time.utc(..., 0.5)` and `new Time(..., 0.5)` keep the fraction;
      `#nsec` answers `500000000`.
- [ ] `strftime("%N")` and `%L` answer real digits.
- [ ] Integer-second construction is unchanged — `%N` stays `"000000000"`.
- [ ] Verify each behavior against a live `ruby` (`ruby` is on PATH; the gem is
      not vendored under `vendor/rails`).
