---
title: "Time#change ports Rational sub-second arithmetic as lossy float division"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into time-change-local-and-utc-offset-arms-conflated — both are divergences inside the single Time#change body (core_ext/time/calculations.rb:130-176)"
---

## Context

Rails' `Time#change` keeps the sub-second component as an exact `Rational`
(`activesupport/lib/active_support/core_ext/time/calculations.rb:134`,
`:136`, `:141`):

```ruby
new_usec = Rational(new_nsec, 1000)
new_usec = options.fetch(:usec, ... Rational(nsec, 1000))
new_sec += Rational(new_usec, 1000000)
```

`packages/activesupport/src/time-ext.ts` `change` ports all three as IEEE-754
float division (`newNsec / 1000`, `nsec / 1000`, `newUsec / 1_000_000`), then
recovers nanoseconds with `Math.round((newSec - secFloor) * 1_000_000_000)`.
The round-trip is lossy for sub-second values that are not representable in
binary, so a `usec`/`nsec` that Rails preserves exactly can come back off by a
nanosecond. Callers already lean on the boundary value `999999999 / 1000`
(`endOfDay`, `endOfHour`, `endOfMinute`).

## Acceptance criteria

- [ ] Sub-second arithmetic in `change` is exact for every integer
      `usec`/`nsec` in range — no float round-trip through `newSec`.
- [ ] `endOfDay`/`endOfHour`/`endOfMinute` land on exactly 999999999ns.
- [ ] Rails' locals (`new_usec`, `new_sec`) keep their names and positions.
