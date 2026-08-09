---
title: "Align fastStringToTime's accepted grammar with Ruby's Time.new(string)"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "No behavioral divergence: the story records that fast and fallback paths converge on the same instant — only which internal path runs differs. Aligning TS/Temporal grammar to Ruby's Time.new(string) is routing tidiness, not port convergence."
---

## Context

`fastStringToTime` in `packages/activemodel/src/type/helpers/time-value.ts`
mirrors `Helpers::TimeValue#fast_string_to_time`
(`vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb:79-89`),
which is `::Time.new(string)` / `::Time.new(string, in: "UTC")`. Trails
substitutes Temporal parsing (`Instant.from` for offset-bearing strings,
`PlainDateTime.from` otherwise).

Ruby's `Time.new(string)` and Temporal do not accept the same grammar, so the
fast/fallback split lands differently than in Rails. Confirmed example:
`"1999-12-31 12:34:56.789 -1000"` (Rails' own `date_time_test.rb:39-44`
value) is rejected by our `fastStringToTime` and handled by
`fallbackStringToTime`. The cast result matches because both paths converge on
the same instant, but the routing does not, and any behavior that differs
between the two paths (offset handling, `overflow: "reject"` strictness) would
diverge silently.

## Acceptance criteria

- Establish which string grammar Ruby's `Time.new(string)` accepts (checked
  against a real Ruby, as PR #5567 did for `Date._parse`) and align
  `fastStringToTime` to it, so strings Rails handles on the fast path are
  handled on ours.
- Cases that must stay on the fallback path are justified at the call site.
- Existing datetime tests keep passing with names unchanged.
