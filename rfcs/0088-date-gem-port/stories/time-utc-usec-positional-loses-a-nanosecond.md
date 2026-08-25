---
title: "Time.utc/mktime's usec positional loses a nanosecond to float arithmetic"
status: done
updated: 2026-08-15
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6551
claim: "2026-08-14T23:15:08Z"
assignee: "executor-seam-end-to-end-request-coverage"
blocked-by: null
closed-reason: null
---

## Context

`Time.utc(year, month, day, hour, min, sec, usec)` and `Time.mktime`'s seventh
positional (`packages/date/src/time.ts:256-280`, `:281-298`) fold the
microsecond into `sec` as a float: `sec + usec / 1_000_000`. That loses the
last nanosecond for values MRI holds exactly, because MRI's `Time` keeps the
sub-second as a `Rational` (`time.c`, `time_s_mkutc` → `time_new_timew`), not a
double.

Measured while enrolling `string_ext_test.rb:587-601` in PR #6547:

```text
Time.utc(2005, 2, 27, 23, 50, 19, 275038).toTime().epochNanoseconds
  // => 1109548219275037999n   (MRI: ...275038000)
```

The test had to spell the exact value as
`Time.utc(2005, 2, 27, 23, 50, new Rational(19275038, 1000000))` to compare
against `String#to_time`'s output, which routes the parsed `:sec_fraction`
through the `Rational` arm and is exact. The `Rational` arm of the same
constructor is already correct — only the `usec` positional is lossy.

## Converged shape

Build the seventh positional as `Rational` too:
`sec instanceof Rational ? sec.add(new Rational(usec, 1_000_000)) : new Rational(sec, 1).add(new Rational(usec, 1_000_000))`,
so the integer path never touches a double. `Time.mktime` (`time.ts:290-296`)
and `Time.utc` (`time.ts:265-272`) both need it; `subsecNanoseconds` already
takes a `Rational`.

## Acceptance criteria

- [ ] `Time.utc(2005, 2, 27, 23, 50, 19, 275038)` and the `Rational` spelling of
      the same value answer identical `epochNanoseconds`.
- [ ] `packages/activesupport/src/core-ext/string-ext.test.ts`'s
      `"string to time"` case is restored to Rails' literal
      `Time.utc(2005, 2, 27, 23, 50, 19, 275038)` / `Time.mktime(...)` calls and
      the note about the float positional is deleted.
