---
title: "ruby-compat-move-time-from-date"
status: draft
updated: 2026-10-27
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

Ruby `Time` is core (`vendor/ruby/v3.3.11/time.c`), as is `Time#strftime`
(`time.c:5194-5210`, `rb_strftime_alloc`), yet trails ports it in
`packages/date/src/time.ts` (2090 lines), with `strftime.ts` (666) and the
tzdata tables `tzdata-abbreviations.ts` (690) / `tzdata-isdst.ts` (884).
ruby-compat, the "Ruby core/stdlib primitives" leaf, holds only the `rbCTime`
seat and reaches Time behaviour through `TEMPORAL_METHOD_TABLE` entries the
date package installs at load time (`getutc`, `getlocal`, `toTime`,
`xmlschema`, `iso8601` at `packages/date/src/time.ts:2063-2087`, and
`strftime` at the end of `packages/date/src/date.ts`, added by trails#9373).

Consequence: `Logger::Formatter#format_datetime`
(`packages/ruby-compat/src/logger/formatter.ts`, mirroring
`vendor/ruby/v3.3.11/lib/logger/formatter.rb:21-23`) reads
`TEMPORAL_METHOD_TABLE.Date.strftime`, which raises `TypeError` unless
`@blazetrails/date` was imported first. In Ruby that call can never fail. It
blocks stdlib-only consumers (mini_magick's `Logger.new($stdout)`,
`vendor/mini_magick/v5.2.0/lib/mini_magick/configuration.rb:83`) from using
ruby-compat's Logger without the date package.

Known tangle: `packages/date/src/strftime.ts:2` imports `ERANGE` from
`./date.js`, so `ERANGE` must move down (or come from ruby-compat `errno`).
`time.ts` imports `@js-temporal/polyfill`, so ruby-compat gains its first npm
dependency. It is still no workspace dependency. `Date` / `DateTime`
(`ext/date`, `date.ts`) stay in the date package and import `Time` /
`strftime` from ruby-compat.

## Acceptance criteria

- `Time`, `rbStrftime` / `strftime`, and the tzdata tables live in
  `packages/ruby-compat/src` at their Ruby names; the date package re-exports
  or imports them, and nothing in ruby-compat reads a Time method through a
  table the date package fills.
- `Logger::Formatter#format_datetime` calls `time.strftime(...)` directly; the
  `TEMPORAL_METHOD_TABLE` `strftime` seat added in `packages/date/src/date.ts`
  is deleted.
- A ruby-compat test formats a default `Logger` line with no
  `@blazetrails/date` import.
- Existing date and activesupport time tests pass unchanged; parity gates
  green, no new extra surface.
