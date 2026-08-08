---
title: "Time#change conflates the elsif zone and trailing utc_offset arms and drops isdst"
status: draft
updated: 2026-08-08
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Time#change` has two distinct trailing arms
(`activesupport/lib/active_support/core_ext/time/calculations.rb:173-176`):

```ruby
elsif zone
  ::Time.local(new_sec, new_min, new_hour, new_day, new_month, new_year, nil, nil, isdst, nil)
else
  ::Time.new(new_year, new_month, new_day, new_hour, new_min, new_sec, utc_offset)
end
```

`packages/activesupport/src/time-ext.ts` `change` conflates them: a JS `Date`
receiver unconditionally takes the `local()` helper (the `elsif zone` arm), and
the trailing `else ::Time.new(..., utc_offset)` arm is not ported at all. The
`isdst` argument Rails passes to `Time.local` is also dropped — `local()` builds
through `new Date(y, m-1, ...)`, which resolves an ambiguous DST-fold nominal
time by the host's rule rather than by the receiver's `isdst`.

PR #6246 (the `:offset`/`:nsec`/`utc?` arms) left this untouched; it is
pre-existing, and the `Date` vs `Temporal.ZonedDateTime` receiver split is the
thing that makes the two arms indistinguishable.

## Acceptance criteria

- [ ] The `elsif zone` and trailing `else` arms are separately reachable and
      each matches its Rails line.
- [ ] `local()` threads the receiver's `isdst` the way `::Time.local`'s 9th
      argument does, so a fold-ambiguous nominal time picks the receiver's
      occurrence.
- [ ] Covered by `test_change_preserves_offset_for_local_times_around_end_of_dst`
      (`activesupport/test/core_ext/time_ext_test.rb:472`), currently `it.skip`.
