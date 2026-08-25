---
title: "port-string-to-time-and-to-date"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6547
claim: "2026-08-14T21:41:01Z"
assignee: "converge-activesupport-module-deprecator-and-gem-version"
blocked-by: null
closed-reason: null
---

## Context

`String#to_time` (`vendor/rails/activesupport/lib/active_support/core_ext/string/conversions.rb:22-38`)
is not ported. `parity:api` does not report it missing because
`core_ext/string/conversions.rb` buckets onto `time-ext.ts`, where `Time#to_time`
already occupies the name `toTime` — the flat index credits the Time arm and the
String arm silently has no port. The same masking applies to `String#to_date`
against `Time#to_date`/`toDate`.

The gap has a live caller now: `inTimeZone`
(`packages/activesupport/src/time-ext.ts`, `String#in_time_zone`, zones.rb:8-14)
must fall back to `to_time` when no zone is set. With no `String#to_time` to
call, it parses through the host `new Date(str)`, which differs from Ruby's
`Date._parse` in accepted formats and has no equivalent to conversions.rb's
`parts.fetch(:year, now.year)` / `fetch(:hour, 0)` defaulting for missing
components, nor its `form` (`:local` / `:utc`) parameter.

Rails' own tests for the missing behaviour are the `it.skip`s already sitting in
`packages/activesupport/src/core-ext/string-ext.test.ts` under
`describe("StringConversionsTest")`: `string to time`, `timestamp string to
time`, `string to time utc offset`, `partial string to time`, the four
standard-time/daylight-savings pairs, and `string to date`.

## Acceptance criteria

- [ ] `String#to_time` is ported at a name the flat index does not collide on
      (the `core-ext/date/calculations` subpath-export precedent, or a
      `RUBY_FILE_TS_OVERRIDES` split of `core_ext/string/conversions.rb` onto its
      own file), with conversions.rb's `used_keys` guard, `parts.fetch` defaults
      and `form` parameter.
- [ ] `inTimeZone`'s `else` arm calls it instead of `new globalThis.Date(str)`,
      and the deviation note at that call site is removed.
- [ ] The `StringConversionsTest` skips above are enrolled with their Rails
      assertions.
- [ ] `pnpm parity:api` delta non-negative; call/arg ratchets green.
