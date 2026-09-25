---
title: "DateAndTime::Calculations eagerly imports date/time calculation modules, blocking include() in time/date files"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb:1-4` requires only `object/try` and `date_time/conversions`: `DateAndTime::Calculations` reads `Date`, `Time`, `DateTime` and `ActiveSupport::TimeWithZone` at call time, so `time/calculations.rb:12` and `date/calculations.rb:11` can `include DateAndTime::Calculations` in their own files.

trails' `packages/activesupport/src/core-ext/date-and-time/calculations.ts` eagerly imports `../date/calculations.js`, `../date-time/calculations.js`, `../../time-ext.js` and `../../time-with-zone.js`. It needs them for its JS-`Date` / `Temporal.PlainDate` / `PlainDateTime` receiver arms (every `// boundary:` dispatch: `advance`, `toDate`, `classCurrent`, `change`, `receiver`, `beginningOfDay`, `endOfDay`, `beginningOfWeek`, ...). Each of those four imports leads back to `core-ext/time/calculations.ts` and `core-ext/date/calculations.ts`, directly or through `duration.ts`.

trails#8083 showed the consequence. With `include(RubyTime, …)` / `include(RubyDate, …)` moved into the time/date files, a plain-node import of `dist/core-ext/date-and-time/calculations.js` or `dist/index.js` throws `DAYS_INTO_WEEK is not defined`, raised from `time/calculations.js`'s `include`. That blocked `spell-date-and-time-calculations-include-in-time-and-date-files`.

## Converged shape

- `date-and-time/calculations.ts` dispatches only over `RubyDate` / `RubyTime` receivers, as Rails' module body does over `self`: `self.class.current` becomes `RubyTime.current()` / the Date equivalent, and `advance` / `change` are the receiver's own methods.
- It no longer imports `date/calculations`, `date-time/calculations`, `time-ext` or `time-with-zone`. It reads `ActiveSupport::TimeWithZone` through the `ActiveSupport` namespace seat at call time, per CLAUDE.md § "Call-time constant resolution".

## Acceptance criteria

- `date-and-time/calculations.ts`'s runtime import graph reaches neither `core-ext/time/calculations.ts` nor `core-ext/date/calculations.ts`.
- With the includes moved into those two files, a plain-node import of each built `dist/` entry (date-and-time/calculations, date/calculations, time/calculations, index) succeeds, which unblocks `spell-date-and-time-calculations-include-in-time-and-date-files`.
