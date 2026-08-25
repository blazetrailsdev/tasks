---
title: "DateTime#sf carries a JS number where ComplexDateData carries an exact Rational"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps:
  - datetime-new-offset-arg-is-not-val2off
deps-rfc: []
est-loc: 250
priority: null
pr: 6177
claim: "2026-08-07T15:38:12Z"
assignee: "datetime-sf-is-a-number-not-a-rational"
blocked-by: null
closed-reason: null
---

## Context

`ComplexDateData`'s `sf` is a Ruby Rational (`vendor/date/ext/date/date_core.c:215-231`),
exact at any denominator. `DateTime`'s `#sf` (`packages/date/src/date.ts`) is a
JS `number` of nanoseconds, and `secFraction` / `nsToSec`
(`date_core.c:993-998`) already document the analogue.

PR #6163 made the gap observable. `%N` at a width past nine reads the
sub-nanosecond tail, and `subsecDigits` has to stop at fifteen digits —
`MAX_EXACT_SUBSEC_SCALE`, where `1e9 * 1e6` leaves `Number.MAX_SAFE_INTEGER` —
and pad zeros from there. MRI's `%N` arm has no ceiling at all: `mul`/`div`
(`date_strftime.c:288-303`) are exact Rational arithmetic, so

```text
ruby 3.3.11: DateTime.new(2008, 3, 1, 6, 0, Rational(1, 3)).strftime("%30N")
             # => "333333333333333333333333333333"
```

where the port would pad zeros past digit 15.

The divergence is UNREACHABLE today, which is why PR #6163 documented it rather
than fixing it: the constructor takes `second` as a `number` with no
Rational-accepting overload, and rounds it to a whole nanosecond through
`d_lite_plus`, so the only producer of a sub-nanosecond `sf` is `dtNewByFrags`
over a decimal literal in a parsed string — whose expansion terminates, and for
which MRI pads zeros too. It becomes reachable the moment `second` accepts the
Rational MRI accepts.

## Converged shape

`#sf` holds the `Rational` the C holds — the class already exists in
`packages/date/src/date.ts` — and `DateTime`'s `second` parameter accepts it
alongside `number`, as `datetime_initialize`'s `check_numeric` does
(`date_core.c:7832`). `subsecDigits` then scales exactly and drops its
`MAX_EXACT_SUBSEC_SCALE` cliff; `secFraction` answers the Rational MRI answers.

Sequence with `datetime-new-offset-arg-is-not-val2off`, which wants the same
Rational-argument admission on `offset`.

## Acceptance criteria

- [ ] `DateTime.new(2008, 3, 1, 6, 0, new Rational(1, 3)).strftime("%30N")` is
      `"333333333333333333333333333333"`.
- [ ] `subsecDigits` loses `MAX_EXACT_SUBSEC_SCALE` and its zero-pad branch.
- [ ] `secFraction` answers a `Rational`, and every existing number-argument
      value is unchanged.
- [ ] Verify each value against a live `ruby -rdate -e`.
