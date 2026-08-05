---
rfc: "0000-corelib-package"
title: "corelib package: vendored Ruby core library with Temporal substrate"
status: active
created: 2026-08-05
updated: 2026-08-05
owner: "@your-handle"
packages:
  - "corelib"
  - "i18n"
  - "activesupport"
  - "activemodel"
  - "activerecord"
clusters: []
related:
  - "0074-i18n-parity"
priority: 1
---

# corelib package: vendored Ruby core library with Temporal substrate

Give the Ruby core-library layer trails already carries — `Date`, `DateTime`,
`Time`, `Range`, `String#succ`, and the module-mixin primitives — a **vendored
source of truth** in a package of its own, and re-seat the date/time value
representation on **JS `Temporal`**, keeping Ruby fidelity where it is
observable: parsing and formatting.

## Why

RFC `0074-i18n-parity` is the i18n gem's parity RFC. **32 of its 131 stories
(24%, 3,510 of 13,080 est-loc, 24 merged PRs) are not i18n at all** — they are a
port of Ruby's `Date`/`DateTime`/`Time`. `packages/i18n/src/date.ts` is **2,554
lines**, larger than `packages/i18n/src/backend/base.ts` (705), which is the
actual gem core.

That cluster has no anchor. `vendor/i18n/lib/i18n/` ships no date
implementation; the thing being ported is `date-3.4.1/ext/date/date_parse.c` —
Ruby's C stdlib — which is **not vendored anywhere in the repo**. Consequences,
each verified:

- `api:compare` cannot resolve it. `scripts/api-compare/extra-surface.ts:12`
  walks _from each Ruby file_ to its expected TS file, so a TS file with no Ruby
  counterpart lands in the `rubyFile === null` slice
  (`extra-surface.ts:531`) — counted as extra surface, never compared
  method-by-method.
- `test:compare` cannot match it. Both test files
  (`packages/i18n/src/date.trails.test.ts`, `time.trails.test.ts`, 690 lines) use
  the `.trails.test.ts` suffix — TS-only extras, outside the compared population
  by construction.
- The call-set ratchet has nothing to ratchet against.

**This is the one campaign in trails where the repo's self-terminating gate
mechanism does not apply, which is why it has no natural stopping point.**

### The finding that sets the priority

`packages/i18n/src/date.ts` and `time.ts` — 2,842 lines, 32 stories, 24 merged
PRs — have **exactly one consumer outside their own package, and it is a test
file**: `packages/activesupport/src/i18n.test.ts:5`. Nothing in production
imports them. Even i18n's own `localize` does not — `backend/base.ts:358`
duck-types its argument on `strftime`/`wday`/`mon`/`hour`/`sec`
(`base.ts:248-256`), exactly as the gem does, so it never names the `Date` class.

So the cluster is unmeasured, unanchored, **and unconsumed**. The migration cost
is one import today and grows monotonically from here. **This is the cheapest
this decision will ever be.**

### It is not a special case

Two smaller files do exactly the same thing — port Ruby C source, cite it by
symbol, with no Rails file to compare against:

- `packages/activesupport/src/range-ext.ts:65-100` — `rangeIncludesStringValue`
  ports `range.c` `range_include_internal` / `str_upto_each`; tagged
  `@noRailsEquivalent PERMANENT` at `range-ext.ts:19-22`.
- `packages/activesupport/src/core-ext/string/succ.ts` — ports `string.c`
  `rb_str_succ`; `succ.ts:6-8` already says it outright: _"a Ruby core method,
  not a Rails extension, so it has no `core_ext/string/_.rb` counterpart."\*

The repo has **named this category in a JSDoc tag and has nowhere to put it.**

## What this RFC does NOT claim

**Temporal is not a burndown.** The state-vs-boundary split of the 32 stories is
**19 boundary / 11 state / 2 mixed**, and the line split agrees independently:
**1,714 of 2,554 lines (67%) is parse + format.** Roughly two-thirds of the work
is boundary fidelity that survives the substrate change untouched. Adopt Temporal
on correctness and interop grounds. It retires about a third of the cluster.

**Vendoring is the load-bearing move; Temporal is the correctness move.** They
are separable, and this RFC sequences vendoring _first_ so the substrate
migration is measured rather than taken on faith.

## Decision 1 — Temporal as substrate, Ruby at the boundary

Stop re-implementing Ruby's internal `Date` representation (`#jd`/`#sg`,
Julian-day + calendar-reform-start, rational offsets). Make `Temporal` the value
type. Keep Ruby fidelity where it is **observable** through the surfaces trails
exposes: AR date/datetime/time columns and casts, `I18n.localize`, `strftime`,
AS date/time format helpers, `to_date`/`to_time`.

| Ruby semantics                                                                                 | Temporal position                                               | Observable?                                                                                                                | Verdict                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Date` carries `(jd, sg)`; Julian before the reform, so 1582-10-10 / 1500-02-29 are real dates | `PlainDate` is proleptic ISO; those dates cannot be constructed | **No** — needs a pre-1582 date _and_ a non-default `start`; no AR column, `localize` call, or format helper passes `start` | **Drop**                                                                                                                                                                                                                                                                                                                              |
| `Date::ITALY`/`ENGLAND`/`JULIAN`/`GREGORIAN` + `start` on every constructor                    | no analogue                                                     | **No** — `start` is never passed by any consumer                                                                           | **Drop** (keep constants inert if tests name them)                                                                                                                                                                                                                                                                                    |
| `Date` vs `DateTime` vs `Time`                                                                 | `PlainDate` / `PlainDateTime` / `ZonedDateTime` / `Instant`     | **Yes** — `localize` routes to `date.formats` vs `time.formats` on whether the object answers `sec` (`base.ts:369`)        | **Keep**, map deliberately                                                                                                                                                                                                                                                                                                            |
| Sub-minute UTC offsets                                                                         | Temporal offset zones are minute-precision                      | **Yes** — `%z`/`%Z`                                                                                                        | **Keep — already solved.** `time.ts:26-28` keeps the offset as _"a number trails owns, so that MRI's sub-minute offsets are representable where a Temporal offset time zone (minute-precision) cannot hold them"_ — Temporal substrate plus a Ruby-owned scalar at the boundary is precisely this RFC's architecture, already shipped |
| `Rational` offsets / exact fractional-day arithmetic (`date.ts:431-471`)                       | nanosecond integers, no rationals                               | **Barely** — no real zone, DB column, or format directive exposes sub-nanosecond offset precision                          | **Drop the exactness guarantee**, keep seconds-as-number                                                                                                                                                                                                                                                                              |
| `Date` arithmetic returning `Rational`                                                         | `Duration` / `PlainDate.add`                                    | **No** — no trails surface does fractional-day date arithmetic                                                             | **Drop**                                                                                                                                                                                                                                                                                                                              |
| Ranges over dates; `Range#include?` via `succ`                                                 | comparable but not `succ`-able                                  | **Yes** — AR `where` → `BETWEEN`; `clusivity.ts:218`                                                                       | **Keep**                                                                                                                                                                                                                                                                                                                              |
| DST edges                                                                                      | Temporal forces explicit `disambiguation`                       | **Yes** — `TimeWithZone`, AR tz conversion                                                                                 | **Keep**, pin to Ruby's policy once, here                                                                                                                                                                                                                                                                                             |
| `Time` fixed offset vs named zone                                                              | offset TZ vs IANA TZ                                            | **Yes** — `%Z`; `time.ts:1-7` gives this as the reason `time.ts` exists                                                    | **Keep**                                                                                                                                                                                                                                                                                                                              |
| `Date._parse` fragment hash — partial results, `{}` for no match                               | `Temporal.PlainDate.from` is strict ISO                         | **Yes, maximally**                                                                                                         | **Keep in full** — the 1,566-line bulk, not replaceable by Temporal parsing at any fidelity                                                                                                                                                                                                                                           |

### This continues an existing convention rather than changing it

`packages/activesupport/src/temporal.ts` is the single re-export point; **70
files** import `Temporal` from `@blazetrails/activesupport/temporal`. The
convention is not merely followed but **enforced**: `quoting.ts:162,219` (and the
sqlite3/mysql/pg quoting files) _throw_ on a JS `Date` —
`"quote: JS Date is not accepted — use a Temporal type"`. Declared value types
are Temporal throughout: `DateCastResult = Temporal.PlainDate | …`
(`activemodel/src/type/date.ts:15`), `DateTimeCastResult = Temporal.Instant | …`
(`type/date-time.ts:18`), `TimeWithZone` on `Temporal.ZonedDateTime`
(`time-with-zone.ts:108-327`). JS `Date` survives only as a _coercible input_
(`type/date.ts:41`, `type/date-time.ts:228`).

**`packages/i18n/src/date.ts` is the sole holdout** — a third dialect
(`#jd`/`#sg`, `date.ts:2228-2233`) that interoperates with neither Temporal nor
JS `Date`, consistent with it having no production consumer. This RFC removes the
holdout; it does not introduce the convention.

## Decision 2 — a `corelib` package

Three shapes were weighed. **(c) leave it and re-anchor** fails on its own terms:
without vendoring, the gate still cannot go green, so the cluster still has no
stopping condition — the presenting problem — and i18n's parity numbers keep
carrying 2,842 lines of Ruby core. **(a) a `date`-only package** is correct but
under-scoped: it fixes 2,842 of 3,407 unanchored lines and leaves `range-ext.ts`,
`succ.ts`, `include.ts`, `prepend.ts` untouched, requiring a second RFC against
the same vendored sources within months.

**(b) `packages/corelib` wins**, for reasons of structure rather than volume:

1. **It names a category the repo has already diagnosed** (`succ.ts:6`) and has
   no destination for.
2. **The vendoring work is shared** — `ruby/date` and `ruby/spec` anchor Date,
   Time, Range, and `succ` at once.
3. **It fixes a dependency inversion (a) cannot.**
   `core-ext/range/compare-range.ts:9,78-82,123-127` — a properly anchored Rails
   core-ext file — reaches _upward_ into the unanchored `range-ext.ts` for
   `rangeIncludesValue`, naming it `super` in its JSDoc. Rails' real
   `compare_range.rb` calls Ruby's core `Range#cover?` there. The dependency is
   correct in shape and pointing at the wrong package. Under this RFC that import
   crosses a package boundary and becomes Rails-core-ext → Ruby-core, which is
   what Ruby does.
4. **It matches established precedent.** `packages/{did-you-mean,globalid,nokogiri,rack,i18n}`
   are already non-Rails vendored packages. `did-you-mean` is the exact template,
   including the source-name/package-name split (`vendor/sources.ts` derives the
   TS dir from the kebab package name). `apiComparePackageRoots()`
   (`scripts/api-compare/config.ts:101`) derives roots from the package name, so
   `corelib` needs a `SOURCES` entry and a `PACKAGES` entry and nothing else.

Named `corelib`, not `core`: `packages/core` is a scope magnet in a monorepo, and
scope sprawl is this RFC's main risk. Not named `ruby`: it is not a Ruby runtime.

### Two anchoring contracts — do not conflate them

- **Date/DateTime/Time/Range/`succ`** anchor to **source** (`ruby/date`'s
  `lib/date.rb`) _and_ **tests** (`test/date/`) → `api:compare` + `test:compare`.
- **`Module#include`/`#prepend`** live in `eval.c`/`class.c` as interpreter
  internals. There is no portable source to mirror — only _behavior_, via
  `ruby/spec`'s `core/module/*`. They enroll in **`test:compare` only**;
  **no `api:compare` enrollment**. An enrollment story that conflated these could
  not pass.

### Vendoring

```ts
// vendor/sources.ts
{ name: "date",
  origin: { type: "git", url: "https://github.com/ruby/date.git", ref: "v3.4.1" },
  packages: [{ name: "corelib", libPath: "lib", testPath: "test/date" }] },
```

`v3.4.1` matches the version the port already cites. It brings `lib/date.rb`,
`ext/date/date_parse.c`, `ext/date/date_core.c` (which `date.ts`'s JSDoc cites by
line throughout — e.g. `date.ts:2213` cites `date_core.c:186`), and `test/date/`.
Plus `ruby/spec` at a pinned SHA, scoped to `core/{module,range,string}`.

**Highest-risk assumption, scoped to a spike (S2):** `extract-ruby-api.rb` parses
Ruby, not C. The fallback — enroll `lib/date.rb` + `test/date/` normally and
treat the C sources as a vendored _read-anchor_ with `UNPORTED_FILES` `pattern`
entries — **still fixes the presenting problem**, because `test:compare` over
`test/date/` gives the cluster a real, shrinking, self-terminating gate. No
C-parser project is required.

## The Ruby/Rails boundary — what does NOT move

Anything with a `.rb` counterpart stays where it is measurable. Moving it would
charge Rails' surface to a non-Rails package and _destroy_ working `api:compare`
coverage — the exact inverse of the problem being solved.

**Stays in activesupport** (counterparts verified in
`vendor/rails/activesupport/lib/active_support/`): `concern.ts` (`concern.rb`),
`delegation.ts` (`delegation.rb`), `class-attribute.ts` (`class_attribute.rb`),
`descendants-tracker.ts` (`descendants_tracker.rb`), `core-ext/object/blank.ts`,
`try.ts`, `transliterate.ts`, `inflector.ts`, `core-ext/big-decimal/*`,
`module-ext.ts` (mostly Rails: `delegate`, `mattr_accessor`, `cattr_accessor`,
`attr_internal`).

**The Range split is the cleanest illustration** — `core-ext/range/` is **1:1**
with `core_ext/range/`:

| Moves to `corelib` (unanchored Ruby core)                                     | Stays in activesupport (1:1 anchored Rails)                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `range-ext.ts:14-26` — the begin/end/excludeEnd triple (`exclude_end?`)       | `core-ext/range/overlap.ts` (68) — Rails `Range#overlap?`          |
| `range-ext.ts:37-45` `rangeIncludesValue` — Ruby `cover?`                     | `core-ext/range/conversions.ts` (89) — Rails `#to_fs`              |
| `range-ext.ts:65-100` `rangeIncludesStringValue` — Ruby `include?` via `succ` | `core-ext/range/each.ts` (63) — Rails `#each`/`#step`              |
| `core-ext/string/succ.ts` (112) — its dependency                              | `core-ext/range/compare-range.ts` (138) — Rails `#===`/`#include?` |
| **209 lines, unanchored**                                                     | **358 lines, 1:1 anchored**                                        |

**Explicitly excluded from this RFC:** the `*-adapter.ts` family (Node platform
abstraction, not Ruby semantics), the `*-utils.ts` family (helper grab-bags; some
are likely mis-filed Rails core-ext, which is RFC `0023` territory and must not be
smuggled in here), and `temporal.ts` (substrate re-export, stays as the entry
point).

## Dependency direction — verified acyclic

- `packages/i18n/package.json` declares only `@js-temporal/polyfill`
  (+ optional `yaml`). `date.ts` imports nothing from activesupport; `time.ts`
  imports only `./date.js`. **The date layer needs nothing from AS today — no
  `Duration`, no `TimeZone`.** `corelib` is a true leaf.
- **i18n → date is structural, not circular, and the gem guarantees it.**
  `localize` duck-types on `strftime` and never names a `Date` type, so `corelib`
  does not depend on i18n and cannot come to.
- AS/AM/AR depend on `corelib`; `corelib` depends on nothing but the Temporal
  polyfill.

### `corelib` owns the Temporal polyfill

Today `@js-temporal/polyfill` is declared **twice** — `packages/i18n/package.json:26`
and `packages/activesupport/package.json:98` — and only 3 files import it
directly (`activesupport/src/temporal.ts`, `i18n/src/{date,time}.ts`), the latter
two bypassing the chokepoint that the other 70 call sites use.

The codebase identifies Temporal values by `instanceof` everywhere
(`type/date.ts:34`, `type/date-time.ts:226`, `quoting.ts:155-158`).
**`instanceof` is identity-sensitive across module instances**: two polyfill
copies would make `value instanceof Temporal.PlainDate` return `false` for a
valid value, and the AR quoting guard would then fall through to
`throw new TypeError("can't quote …")` — silent and painful to diagnose. Both
specs are `^0.5.1` and pnpm currently dedupes them to one store path, so this
works **by version coincidence, not by design**; one divergent bump breaks it.

`corelib` takes sole ownership and re-exports `Temporal`;
`activesupport/src/temporal.ts` becomes a re-export from `@blazetrails/corelib`,
so **all 70 `@blazetrails/activesupport/temporal` import sites stay untouched** —
a one-file change, not a 70-file migration. The polyfill is also transitional
(Temporal is Stage 3 and shipping natively); a single owner makes its eventual
removal one line in one package.

`instantFrom(date: Date)` stays in activesupport — it is a JS-Date interop
helper, and `corelib` should have no opinion about JS `Date`.

## Disposition of RFC 0074's open date stories

Three of the four open stories are exactly the internal-state fidelity this RFC
abandons. **Per CLAUDE.md this is supersession, not ratification** — each closure
cites the gap-table row that removes its referent, each is re-derivable from this
RFC if the substrate decision is ever reversed, and none lands in a deviation
register.

| Story                                                 | Class    | Disposition                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `date-initialize-guess-style-fast-path` (in-progress) | state    | **Close as superseded — but confirm with the holder first.** It ports `date_initialize`'s guess-style fast path, which exists only to decide JD vs ordinal vs civil _under a `sg`_. Under a `PlainDate` substrate the branch has no referent. It is in-progress; do not close out from under a live agent |
| `datetime-new-start-preserves-the-receiver` (ready)   | state    | **Close as superseded** — definitionally about `start` propagation, dropped by rows 1–2                                                                                                                                                                                                                   |
| `rt-rewrite-frags-rational-offset-exactness` (draft)  | state    | **Close as superseded** — chases exact `Rational` offsets (row 5); unobservable, and `time.ts:26-28` already settled the representable case                                                                                                                                                               |
| `date-strptime-seconds-frag-producers` (draft)        | boundary | **Keep, migrate here** — `strptime` is parsing, required under any substrate, and directly testable against `test/date/test_date_strptime.rb` once vendored. It _gains_ an anchor                                                                                                                         |

**The 28 done stories stay done.** They are shipped work, and 19 of them are
boundary fidelity carrying over unchanged. This RFC re-homes and finally
_anchors_ that work; it does not discard it.

## Sequencing

Phase 1 (S1–S3) vendors and decides the extractor question. Phase 2 (S4)
scaffolds. Phase 3 (S5–S7) moves files mechanically, no behavior change.
Phase 4 (S8–S9) enrolls — **this is where the cluster finally acquires a
stopping condition.** Phase 5 (S10) re-seats the state region on `PlainDate`,
**last, so it is measured by the gates rather than taken on faith.**

## Out of scope — filed separately

- The `instanceof Date` residue in `range-ext.ts` / `clusivity.ts:186` (fixed as
  a side effect of S6) and the actionpack HTTP cache layer
  (`action-dispatch/http/cache.ts:35-196` — a genuine Node/HTTP boundary,
  probably correct as-is). **Not** the AR quoting sites, which are the convention
  being enforced.
- RFC 0074's four `i18n-inspect-*` stories are Ruby `Object#inspect` /
  `String#inspect` semantics with no i18n-gem counterpart and may belong in
  `corelib` in a later wave. **Flagged, deliberately not moved here.**
- The three independent `Range` shapes (`range-ext.ts:14`,
  `activerecord/src/connection-adapters/postgresql/oid/range.ts:26-31`,
  `activerecord/src/attribute-methods/time-zone-conversion.ts:375-382`),
  actionable only once S6 lands.

## Constraints

- Each PR ≤ 500 LOC; one story per PR; PRs branch from `main`, no stacking.
- Ported code lives at the path matching the vendored layout so `api:compare`
  resolves it.
- Test names must match the vendored gem's test names for `test:compare`.
