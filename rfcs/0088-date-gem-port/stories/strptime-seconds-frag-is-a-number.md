---
title: "date__strptime's %Q and %s :seconds frags are JS numbers where MRI's are exact"
status: done
updated: 2026-08-08
rfc: "0088-date-gem-port"
cluster: null
packages:
  - date
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6255
claim: "2026-08-08T18:04:01Z"
assignee: "connection-handler-is-connected-adapter-unique-flake"
blocked-by: null
closed-reason: null
---

## Context

`date__strptime`'s `%Q` and `%s` arms are the last `number`-backed numeric frags
in `packages/date/src/date.ts`. `%N`/`%L` was converged by
`strptime-sec-fraction-numerator-is-a-number` (PR #6192) and the two
`Date._parse` fraction producers by `rational-is-number-backed-not-arbitrary-precision`
(PR #6186); `:seconds` was left behind by both.

`%Q` — `vendor/date/ext/date/date_strptime.c:428-442`:

```c
READ_DIGITS_MAX(n);
if (sign == -1)
    n = f_negate(n);
set_hash("seconds",
         rb_rational_new2(n, INT2FIX(1000)));
```

An exact `Rational` over 1000. trails (`date.ts:2309-2317`) does
`hash.seconds = n / 1000` — a JS float, so a millisecond count not divisible by
1000 is inexact:

```console
$ ruby -rdate -e 'p Date._strptime("1234567890123","%Q")'
{:seconds=>(1234567890123/1000)}
$ node -e 'console.log(1234567890123/1000)'
1234567890.123   # a float, not 1234567890123/1000
```

`%s` — `date_strptime.c:415-426` — is `READ_DIGITS_MAX` straight into
`set_hash("seconds", n)`, i.e. a bignum. trails (`date.ts:2332-2346`) takes the
`number` `readDigitsMax` answers, which loses precision past 2^53:

```console
$ ruby -rdate -e 'p Date._strptime("9007199254740993","%s")'
{:seconds=>9007199254740993}
$ node -e 'console.log(Number("9007199254740993"))'
9007199254740992
```

The declared type is the tell: `DateParts.seconds?: number` (`date.ts:503`),
while `rtRewriteFrags`' own local is already
`let seconds: number | Rational | undefined` (`date.ts:2535`) and its `fIdiv` /
`fMod` / `offset.add(...)` arms already handle the `Rational` side. So the
consumer is converged and only the two producers and the field type are not.

## Converged shape

- `DateParts.seconds` becomes `number | Rational`, matching `secFraction`
  (`date.ts:497`).
- `%Q` builds `new Rational(n, 1000n)` with `n` the bigint over the digit span,
  taken the way `%N` now takes it — `BigInt(str.slice(osi, si))`, i.e. `str2num`
  rather than the `number` `readDigitsAt`/`readDigitsMax` answers (see
  `date.ts:2251-2267` for the shape shipped in #6192). Sign applied to the
  bigint numerator, as `f_negate` is applied to `n` before `rb_rational_new2`.
- `%s` assigns that same bigint directly, per `set_hash("seconds", n)`.
- `%Q`'s arm currently has no `osi`; it needs one, exactly as the C's `%N` does,
  to bound the span `str2num` reads.

Note `Rational` is already `bigint`-backed (#6186), so both arms are exact once
the numerator stops going through `Number`.

## Acceptance criteria

- [ ] `Date._strptime("1234567890123", "%Q")[:seconds]` is the exact
      `Rational(1234567890123, 1000)`, verified against a live `ruby -rdate -e`;
      the negative arm (`"-1234567890123"`) too.
- [ ] `Date._strptime("9007199254740993", "%s")[:seconds]` is exact past 2^53.
- [ ] `DateTime.strptime("1234567890123", "%Q").to_s` is
      `"2009-02-13T23:31:30+00:00"`.
- [ ] The existing `%Q` / `%s` cases keep their values unchanged, and
      `rtRewriteFrags`' `:jd` / `:hour` / `:min` / `:sec` / `:sec_fraction`
      expansion is unchanged for the inputs that were already exact.
- [ ] `DateParts.seconds`'s JSDoc no longer says the frag is a number where
      Ruby's is a Rational.
