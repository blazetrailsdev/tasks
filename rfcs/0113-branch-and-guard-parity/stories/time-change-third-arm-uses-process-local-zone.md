---
title: "time-change-third-arm-uses-process-local-zone"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time#change`'s third arm rebuilds the time **in the receiver's own zone**
(`vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:147-148`):

```ruby
elsif zone.respond_to?(:utc_to_local)
  new_time = ::Time.new(new_year, new_month, new_day, new_hour, new_min, new_sec, zone)
```

trails' port (`packages/activesupport/src/core-ext/time/calculations.ts:151-163`)
tests `this.zone != null` and then calls `RubyTime.local(...)`, which builds in
the **process-local** zone, not the receiver's:

```ts
} else if (this.zone != null) {
  return RubyTime.local(newSec, newMin, newHour, newDay, newMonth, newYear, null, null, this.isdst, null);
```

So a `Time` carrying an IANA zone silently changes zone whenever it goes through
`change` — and therefore through `advance`, which ends in
`change.call(this, { year, month, day })` (`calculations.ts:185`).

Reproduced under `TZ=UTC`, receiver in `America/New_York`:

```text
recv     2024-03-09 12:00:00 -0500 EST
advance  2024-03-10 12:00:00 +0000 UTC   # expected 2024-03-10 12:00:00 -0400 EDT
change   2024-03-10 12:00:00 +0000 UTC   # expected 2024-03-10 12:00:00 -0400 EDT
since    2024-03-09 13:00:00 -0500 EST   # Time#since (plus) is correct
```

The bug is invisible on a host whose local zone happens to match the receiver's,
which is how it survived: it surfaced in PR #7493 as a CI-only failure of two
`duration.trails.test.ts` DST cases that passed on a US/Eastern dev box. That PR
pinned the local zone in its own tests to stay host-independent rather than
widen the deviation; the underlying arm is untouched and is this story.

Rails' same arm also carries a DST second-occurrence correction that trails
drops entirely (`calculations.rb:150-170`): the `utc_offset.integer?` fixup, and
the `offset_difference` block that re-selects the occurrence matching the
receiver's `utc_offset` when a nominal time occurs twice as DST ends.

## Acceptance criteria

- [ ] `Time#change`'s third arm branches on the Rails condition and rebuilds in
      the receiver's zone, mirroring `calculations.rb:147-148` — not
      `RubyTime.local`, which reads the process-local zone.
- [ ] The DST second-occurrence correction at `calculations.rb:150-170` is
      ported with Rails' comments' behaviour: the non-integer `utc_offset`
      fixup and the `offset_difference` re-selection.
- [ ] A regression test builds a `Time` in a zone other than the process-local
      one and asserts `change` and `advance` keep it, running green under at
      least one `TZ` that differs from the receiver's zone. It must fail on
      today's code.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
