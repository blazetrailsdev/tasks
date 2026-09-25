---
title: "spell-date-and-time-calculations-include-in-time-and-date-files"
status: blocked
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-25T13:53:42Z"
assignee: "chars-length-counts-utf16-units"
blocked-by: "Premise falsified: include() is an eval-time read, so a namespace seat (call-time) cannot serve it. Moving include(RubyTime/RubyDate, DateAndTimeCalculations) into core-ext/time/calculations.ts and core-ext/date/calculations.ts builds, but plain-node import of dist/core-ext/date-and-time/calculations.js and dist/index.js throws 'DAYS_INTO_WEEK is not defined' from time/calculations.js:14's include: DAT's own eager imports (date/calculations, date-time/calculations, time-ext, time-with-zone) ALL lead back to time/ and date/calculations, so they evaluate while DAT is in TDZ. Unblocks when DAT's JS-Date/Temporal receiver arms (the '// boundary:' dispatch) converge onto RubyDate/RubyTime so DAT no longer imports those modules (Rails' date_and_time/calculations.rb requires only object/try and date_time/conversions)."
closed-reason: null
---

## Context

Surfaced by trails#8062.

Rails spells `include DateAndTime::Calculations` in the including class's own file: `vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:12-13` (`class Time … include DateAndTime::Calculations`) and `core_ext/date/calculations.rb:10-11` (`class Date … include DateAndTime::Calculations`).

trails#8062 replaced the old `Object.defineProperty` loop with `include(RubyTime, DateAndTimeCalculations)` and `include(RubyDate, DateAndTimeCalculations)`. Both calls still sit at the bottom of `packages/activesupport/src/core-ext/date-and-time/calculations.ts`, behind a `// boundary:` comment, and the `declare module "@blazetrails/date"` `Included<>` merge sits there too. The reason is a cycle: `core-ext/date/calculations.ts` imports `DAYS_INTO_WEEK` from the date-and-time module, and the date-and-time module imports `../date/calculations.js` as `date`. An `include()` in the date/time file would read this module's namespace in TDZ.

CLAUDE.md § "Call-time constant resolution" gives the settled way to break this: seat the module on the `ActiveSupport` namespace object in `activesupport/src/namespaces.ts` (autoload), and read it from the including file.

## Acceptance criteria

- `include(RubyTime, …)` lives in `core-ext/time/calculations.ts` and `include(RubyDate, …)` lives in `core-ext/date/calculations.ts`, where Rails spells them. Each reads `DateAndTime::Calculations` through a namespace seat or otherwise without a TDZ read.
- The `// boundary:` comment and the bottom-of-module includes are removed from `core-ext/date-and-time/calculations.ts`.
- Plain-node import of each built `dist/` module as the entry module succeeds. Per CLAUDE.md, a green vitest run does not prove the cycle is broken.
