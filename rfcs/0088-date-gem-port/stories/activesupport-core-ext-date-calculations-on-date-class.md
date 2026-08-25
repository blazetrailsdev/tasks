---
title: "Port core_ext/date/calculations.rb onto the Date class, not free functions"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6286
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
- `RUBY_FILE_TS_OVERRIDES` entry for this file removed; `pnpm parity:api`
  activesupport ported-method count strictly up.
- `pnpm parity:api:calls`, `pnpm parity:api:extra` green; no new `@noRailsEquivalent`.
- Rails' own test names, verbatim, from
  `vendor/rails/activesupport/test/core_ext/date_ext_test.rb`.

## Resolution (PR #6286)

Shipped: the file moved to the Rails path
`packages/activesupport/src/core-ext/date/calculations.ts` and all 31 methods
of `core_ext/date/calculations.rb` are ported — `parity:api` for the file went
15/31 → 31/31 and activesupport overall 1055 → 1071.

**Two acceptance criteria above were superseded and are recorded here as not
met, by maintainer decision** (the review flagged both across three rounds;
overridden 2026-08-09).

1. **"methods live on trails' `Date`"** — written before
   `date-temporal-default-return-and-ruby-opt-in` (PR #6264) landed RFC 0088's
   headline commitment. `Date.civil` / `.jd` / `.ordinal` / `.commercial` /
   `.parse` all answer `Temporal.PlainDate` (`packages/date/src/date.ts:3857`,
   `:3880`, `:4008`), so the calendar-day _value_ in trails is a `PlainDate`
   and the `Date` class is its constructor/parser. Seating the calculations on
   `Date` would require inventing `Date#+`, `#-`, `#>>`, `#<=>`,
   `#to_datetime` and `Date.today` on a class no factory returns — a second
   parallel calculations surface beside this one. The mixin idiom is also
   unavailable for the actual receiver: `Temporal.PlainDate` is polyfill code
   trails does not own, so the file is free functions over it, which is the
   shape #6234 gave the Date arm.
2. **"`RUBY_FILE_TS_OVERRIDES` entry removed"** — the two halves of this
   criterion are mutually exclusive. `Date`'s first reopening is
   `core_ext/date/acts_like.rb:5`, so without the entry all 31 methods bucket
   there and `core_ext/date/calculations.rb` gets no bucket at all: measured,
   activesupport drops to 1068 matched and 148/223 files, i.e. the count goes
   _down_, not "strictly up". The entry is what splits the bucket, and the same
   mechanism carries `time/calculations.rb` and `date_time/calculations.rb`.
   It now names `core-ext/date/calculations.ts`, the path the default
   kebab-case rule produces.

Re-seating the receiver becomes worth revisiting only if trails ever gives the
`Date` class a value role again; that would be a new story, not this one.
