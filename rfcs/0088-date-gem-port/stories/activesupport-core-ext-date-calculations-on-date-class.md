---
title: "Port core_ext/date/calculations.rb onto the Date class, not free functions"
status: claimed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-08-09T16:14:14Z"
assignee: "activesupport-core-ext-date-calculations-on-date-class"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #6160 (`api-compare-orphan-buckets-activesupport-calculations`),
which pointed `activesupport:core_ext/date/calculations.rb` at
`packages/activesupport/src/time-ext.ts` and made its 34 methods visible for
the first time. **10 match, 21 still read missing.**

The deviation is one of shape, not of coverage. Rails reopens the `Date` class:

- `vendor/rails/activesupport/lib/active_support/core_ext/date/calculations.rb:10`
  — `class Date`, with class methods `beginning_of_week` (:19),
  `beginning_of_week=` (:27), `find_beginning_of_week!` (:32), `yesterday`
  (:38), `tomorrow` (:43), `current` (:48), and instance methods `ago` (:55),
  `since` (:61), `beginning_of_day` (:67), `middle_of_day` (:75), `end_of_day`
  (:85), `plus_with_duration` (:90), `minus_with_duration` (:100), `advance`
  (:127), `change` (:143), `compare_with_coercion` (:152).

trails instead has `packages/activesupport/src/time-ext.ts`: free functions
taking a JS `Date` (the JS built-in, which is a _timestamp_, not Ruby's
calendar `Date`) and returning `Temporal.*`. The class methods and the
`beginning_of_week_default` thread/class-attribute pair have nowhere to land,
and `plus_with_duration`/`minus_with_duration`/`compare_with_coercion` — the
operator arms — are absent entirely.

trails' `Date` analogue is `packages/date/src/date.ts` (`export class Date`,
:2230), seated on `Temporal.PlainDate`, which carries the `date` gem's own
surface (`jd`, `ordinal`, `civil`, `commercial`, `parse`, `strftime`, …) but
none of activesupport's calculations.

## Converged shape

Port `core_ext/date/calculations.rb` onto the `date` package's `Date` class
using the settled mixin idiom (CLAUDE.md "Module mixins"): `this`-typed
functions in a file at the Rails path —
`packages/activesupport/src/core-ext/date/calculations.ts` — assigned onto
`Date`, so the code lives at the Rails name in the Rails-shaped file. Keep the
Rails method names, parameter names, defaults and control flow.

Note `beginning_of_week` is backed by an `Thread.current`-scoped default with a
class-attribute fallback (`beginning_of_week_default`, :19-30); port both arms
rather than collapsing to a single module-level variable.

**When this lands, update the override.** #6160 pinned
`"activesupport:core_ext/date/calculations.rb": "time-ext.ts"` in
`RUBY_FILE_TS_OVERRIDES` (`scripts/api-compare/conventions.ts`). A port to
`core-ext/date/calculations.ts` makes that entry wrong — delete it so the
default kebab-case rule resolves the file.

Related: `activesupport-core-ext-calculations-delegation` covers the call-set
divergences _within_ time-ext.ts; rows it shares with this port must be
deleted from `time-ext.json` by hand (the baseline is only-shrink — never
`--write`/reseed).

## Acceptance criteria

- `core_ext/date/calculations.rb` methods live on trails' `Date` at the Rails
  names, in a Rails-shaped file, with Rails control flow and decomposition.
- Both `beginning_of_week` arms (thread-scoped + class default) ported.
- `RUBY_FILE_TS_OVERRIDES` entry for this file removed; `pnpm api:compare`
  activesupport ported-method count strictly up.
- `pnpm api:calls`, `pnpm api:extra` green; no new `@noRailsEquivalent`.
- Rails' own test names, verbatim, from
  `vendor/rails/activesupport/test/core_ext/date_ext_test.rb`.
