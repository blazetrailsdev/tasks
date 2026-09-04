---
title: "make-time-off-year-nil-skips-instead-of-raising"
status: draft
updated: 2026-09-04
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time.parse`'s `make_time` (`vendor/ruby/lib/time.rb:195-272`, ported in
PR #7484 as `Time.#makeTime` in `packages/date/src/time.ts`) sets `off_year` only
under Ruby's `if year || now` guard (`time.rb:203-206`), then uses it
unconditionally inside the `yday` branch:

```ruby
if day > 28 and day > (mday = month_days(off_year, mon))
```

(`time.rb:217`). When `Time.parse(date, nil)` is called with a `yday`-only date,
`off_year` is `nil` and Ruby raises `NoMethodError` from `month_days`'s
`nil % 4`.

The port writes `Time.#monthDays(offYear!, mon)`. `undefined % 4` is `NaN`, so
`#monthDays` returns `undefined`, `day > 28 && day > mday` is `false`, and the
arm silently skips its day correction instead of failing. Rails fails loud; we
return a slightly wrong Time.

This is the "Ruby raises where JS arithmetic cannot" class — RFC 0082's
territory — and it is documented in `#makeTime`'s JSDoc rather than left silent,
but documented is not converged.

## Acceptance criteria

- The `yday` + `now: null` + no-`year` path fails rather than skipping the
  correction, in whatever spelling is the settled trails analogue of Ruby's
  `NoMethodError` on a nil receiver — a guard Rails does not have is NOT the
  answer, so check whether `#monthDays` should take a non-optional `offYear`
  threaded from a shape that cannot be absent.
- The JSDoc paragraph in `#makeTime` recording the divergence is deleted, not
  re-worded.
- A test pins the raising behaviour, with MRI's answer verified by running
  `ruby` (it is on PATH).
