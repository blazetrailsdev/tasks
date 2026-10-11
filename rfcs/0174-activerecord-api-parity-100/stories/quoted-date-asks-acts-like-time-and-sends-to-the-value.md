---
title: "quoted-date-asks-acts-like-time-and-sends-to-the-value"
status: done
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8791
claim: "2026-10-11T19:09:36Z"
assignee: "quoted-date-asks-acts-like-time-and-sends-to-the-value"
blocked-by: null
closed-reason: null
---

## Context

`Quoting#quoted_date` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:184-199`)
asks `value.acts_like?(:time)` and then sends `utc?` / `getutc` / `getlocal` to the value.

trails' `quotedDate` (`packages/activerecord/src/connection-adapters/abstract/quoting.ts`) asks a
file-local `actsLikeTime` instead, which enumerates five classes with `instanceof` and leaves out
`Temporal.PlainDateTime` (Ruby `DateTime`, which answers `acts_like_time?`,
`activesupport/lib/active_support/core_ext/date_time/acts_like.rb:13`). The three sends go to
file-local `isUtc` / `getutc` / `getlocal` helpers built on a local `instantOf`, none of which Rails has.

The `respond_to?(:usec)` half of the body was converged by the PR for
`activerecord-duck-type-instanceof-to-respond-to`, which is why `pnpm parity:api:duck-types` no longer
lists the pair: the report clears a pair on either duck call, so it cannot see this half.

What blocks a one-line swap to `actsLike.call(value, "time")` + `rbFSend`: a `Temporal.Instant` and a JS
`Date` both answer `acts_like?(:time)` but have no `isUtc` / `getutc` / `getlocal` / `toFs` seat in
ruby-compat's `TEMPORAL_METHOD_TABLE` (only `inTimeZone` is seated for `Temporal.Instant`,
`packages/activesupport/src/time-zone-config.ts:19`), so `rbFSend` raises `NoMethodError` for them.
`Temporal.ZonedDateTime` and `Temporal.PlainDateTime` have all four
(`packages/activesupport/src/core-ext/date-time/calculations.ts:284`).

## Acceptance criteria

- [ ] `quotedDate` asks `actsLike.call(value, "time")` and sends `isUtc` / `getutc` / `getlocal` to the value, in Rails' branch order.
- [ ] The file-local `actsLikeTime`, `instantOf`, `isUtc`, `getutc` and `getlocal` in `abstract/quoting.ts` are deleted.
- [ ] A `Temporal.PlainDateTime` takes the `acts_like?(:time)` arm, as a Ruby `DateTime` does.
- [ ] `quoting.test.ts`, `date-time-precision.test.ts` and `quoting-helpers.trails.test.ts` stay green on all three adapters.
