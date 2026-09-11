---
title: "Time#change collapses Rails' zone-object and zone-string arms because Time has one zone slot"
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 70
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time#change` (`activesupport/lib/active_support/core_ext/time/calculations.rb:146-172`)
has **two** distinct zone arms:

```ruby
elsif zone.respond_to?(:utc_to_local)
  new_time = ::Time.new(new_year, ..., zone)   # a timezone OBJECT
  ...                                          # + the DST re-selection
elsif zone
  ::Time.local(new_sec, ..., isdst, nil)       # a zone STRING (the local zone)
```

Ruby distinguishes them because `Time#zone` returns a `String` for a
process-local time and the timezone _object_ itself for a time built with one
(`Time.new(..., tz)` / `getlocal(tz)`).

trails' `Time` has a single zone slot: `#timeZoneId`
(`packages/date/src/time.ts:352`), and `Time#zone` returns an abbreviation
whenever it is set (`time.ts:1225-1228`), so the two Ruby arms are
indistinguishable. PR #7591 ported the first arm and let `this.zone != null`
carry both; the second arm has no TS counterpart at all. The results agree today
(Ruby's `Time.local(..., isdst, nil)` picks the occurrence matching `isdst`,
which is what the first arm's `offset_difference` re-selection also produces),
but a reader of `calculations.ts` sees three arms where Rails has four, and
nothing in the file says why.

Related: `new Time(..., "America/New_York")` raises, as MRI does
(`packages/date/src/time.trails.test.ts:142-144`), so the zone reaches
`Time.new` through `in:` — the identifier standing in for MRI's zone object,
the same idiom `Time#getlocal` already uses
(`time.trails.test.ts:388-393`).

## Converged shape

A zone-object representation `Time` can hold and answer from `zone`, distinct
from the process-local zone id, so `change` can spell Rails' two conditions —
`zone.respond_to?(:utc_to_local)` and the bare `zone` — as two arms with Rails'
two bodies.

## Acceptance criteria

- [ ] `Time#change` has Rails' four arms in Rails' order, the fourth being the
      `Time.local(new_sec, ..., isdst, nil)` body.
- [ ] The zone-object / zone-string distinction is answered by `Time` itself,
      not re-derived at the `change` call site.
- [ ] The DST tests in `calculations.trails.test.ts` (added by #7591) stay
      green under a `TZ` that differs from the receiver's zone, and a case
      covering the fourth arm — a receiver in the process-local zone crossing
      the fall-back — is added.
- [ ] `pnpm parity:api:calls` shows the `Time.local` call restored, not
      baselined.
