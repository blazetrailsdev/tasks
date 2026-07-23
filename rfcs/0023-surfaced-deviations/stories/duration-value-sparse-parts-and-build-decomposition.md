---
title: "Duration: port @value, zero-rejected sparse parts, and build decomposition"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5105 ported `@variable` tracking into trails Duration
(packages/activesupport/src/duration.ts) but left two structural deviations
from Rails `ActiveSupport::Duration` (vendor/rails/activesupport/lib/
active_support/duration.rb):

- No `@value` field: Rails' `initialize(value, parts, variable)` carries total
  seconds separately (`attr_reader :value`, delegations to it at
  duration.rb:224); trails derives totals via `inSeconds()` from a full fixed
  `parts` record, and the constructor takes `(parts, variable)` only.
- `parts` is a full record, never zero-rejected: Rails does
  `@parts.reject! { |k, v| v.zero? } unless value == 0` (duration.rb:228) and
  `parts` returns a sparse dup; trails always returns all seven keys.
- `Duration.build` (duration.ts) does NOT decompose seconds into calendar
  parts — Rails build (duration.rb:191-214) splits into years/months/… and
  computes `variable` from the nonzero parts; trails returns a seconds-only
  Duration. Consequently `modulo` (Rails `%` goes through `build`,
  duration.rb:311-319) also returns a seconds-only Duration.

## Acceptance criteria

- Duration carries `value` and zero-rejected sparse parts matching Rails'
  constructor shape, or the deviation is justified at the call sites and
  excluded coherently.
- `Duration.build` decomposes per duration.rb:191-214 (PARTS_IN_SECONDS
  div/mod loop) and `parts`/`variable` match Rails for built durations;
  `modulo` inherits the fix via build.
- DurationTest ports covering `build`/`parts` pass unchanged names.
