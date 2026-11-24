---
title: "BCrypt::Engine.calibrate answers equal costs under load"
status: draft
updated: 2026-11-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/bcrypt/test/engine.test.ts:22` ("should calculate the optimal cost factor to fit in a specific time") failed on trails#10726 CI with `expected 5 to be greater than 5`. `Engine.calibrate(minTimeMs)` and `calibrate(minTimeMs * 4)` time real hashes against the wall clock, so on a loaded runner both answer the same cost. Rails' bcrypt-ruby `calibrate` (`vendor/bcrypt-ruby/*/lib/bcrypt/engine.rb`) loops `cost += 1` while `Benchmark.realtime { hash_secret(...) } * 1000 < upper_time_limit_in_ms`. Compare the trails loop with it for a clock or rounding difference that makes it under-count, such as `Date.now` granularity against a monotonic clock.

## Acceptance criteria

- The root cause of the equal costs is identified and the port converges to `engine.rb`'s loop and clock.
- The test passes reliably under load. No retry and no widened bound.
