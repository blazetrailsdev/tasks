---
title: "Split lib/time.rb and ext/date members out of core Time so it imports nothing from date.ts"
status: draft
updated: 2026-10-27
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat-move-time-from-date` cannot move `packages/date/src/time.ts` into ruby-compat as one unit. The file mixes three Ruby sources:

- core `Time` (`vendor/ruby/v3.3.11/time.c`);
- stdlib `lib/time.rb`. `Time.parse` and `Time.strptime` (`lib/time.rb:456-506`) call `Date._parse`, `Date._strptime` and `dNewByFrags` (time.ts ~1154-1224).
- ext/date's `Time#to_date` and `Time#to_datetime` (`ext/date/date_core.c`). They use `Date`, `DateTime`, `SEAT`, `cCivilToJd`, `decodeYear`, `jdLocalToUtc`, `dfLocalToUtc` and `timeToDf` (time.ts ~1590-1625).

Core-only code also reaches into `date.ts`: `vtmFromDate`'s yday uses `cCivilToJd(..., Date.GREGORIAN)` (time.ts:380), `toZonedDateTime` uses `SubMinuteOffsetZonedDateTime` and `of2str` (:1587-1590), `subsecNanoseconds` uses `fToR` (:121), and `strftime.ts:2` imports `ERANGE`.

## Acceptance criteria

- `time.ts`'s core `Time` imports nothing from `date.ts`. The yday computation, `fToR`, `of2str`, `ERANGE` and the sub-minute ZonedDateTime move down or are replaced by core equivalents.
- The `lib/time.rb` and ext/date members are installed onto `Time` from the date package's own files (`time.rb` → `date/src/time-ext.ts`, or the mirrored path), which still import `Date`.
- Existing date and activesupport time tests pass unchanged. After this, `ruby-compat-move-time-from-date` is a pure file move.
