---
title: "duration_test: with_env_tz, zero? delegation and Integer division inspect"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-duration-remainder` (trails#7840), `packages/activesupport/src/core-ext/duration.test.ts` vs `vendor/rails/activesupport/test/core_ext/duration_test.rb`:

- `since and ago anchored to time now when time zone is not set` (`duration_test.rb:283-296`) runs under `with_env_tz "US/Eastern"`. Trails has no in-process way to set the local zone: `@blazetrails/date` reads TZ via `resetLocalTimeZoneId()` (`packages/date/src/time.ts:31`) and the only setter is `process.env.TZ`, which activesupport src may not reference. Converged shape: a `withEnvTz(tz, block)` test helper backed by a `@blazetrails/date` local-zone override (no `process.env`), used here as Rails does.
- `respond to` (`duration_test.rb:368-371`): `assert_respond_to 1.day, :zero?` is answered by `Duration#method_missing` delegating to `value` (`vendor/rails/activesupport/lib/active_support/duration.rb` `method_missing`/`respond_to_missing?`). Converged shape: Duration answers `isZero` through the delegation Rails has.
- `inspect` (`duration_test.rb:110`): `(1.day / 24).inspect == "3600 seconds"` relies on `Integer#/` truncating the `days` part to 0 (`duration.rb:298-307`). Converged shape: `Duration#dividedBy` truncates parts when both operands are Integer-valued, per the trails Integer/Float convention.

## Acceptance criteria

- The three tests carry Rails' assertions and `core_ext/duration_test.rb` reports 0 assertion mismatches.
- No `process.*` in activesupport src.
