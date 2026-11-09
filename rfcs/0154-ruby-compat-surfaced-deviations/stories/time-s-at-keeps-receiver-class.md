---
title: "time-s-at-keeps-receiver-class"
status: draft
updated: 2026-11-09
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`time_s_at` (`vendor/ruby/v3.3.11/time.c:2984-3012`) passes `klass` to every
`time_new_timew(klass, …)` call, so `Stamp.at(0)` on a `Time` subclass answers a
`Stamp`. trails' `Time.at` (`packages/date/lib/time.ts`, `static at`) builds
through `Time.#timeNewTimew` / `Time.#atInstant`, which construct a plain
`Time` regardless of the receiver. Surfaced in trails#9896, whose `getutc`
test had to set the receiver's class directly because of it.

## Acceptance criteria

- `time_new_timew` takes `klass` as in Ruby, and `Time.at` passes `this`.
- `Stamp.at(0)` (subclass of `Time`) answers a `Stamp`, with a test.
