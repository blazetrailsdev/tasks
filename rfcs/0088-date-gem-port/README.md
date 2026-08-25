---
rfc: "0088-date-gem-port"
title: "Port the ruby/date gem as its own package, returning Temporal by default"
status: closed
created: 2026-08-05
updated: 2026-08-19
owner: "@deanmarano"
packages:
  - "date"
  - "i18n"
  - "activesupport"
  - "activemodel"
  - "activerecord"
clusters: []
related:
  - "0074-i18n-parity"
priority: 2
---

# Port the ruby/date gem as its own package, returning Temporal by default

`Date`, `DateTime` and `Time` are **a gem** — `ruby/date`, shipped separately
from the interpreter with its own gemspec, `lib/`, and `test/`. Port it
**wholesale as its own package**, `packages/date`, vendored and enrolled exactly
like the other gem ports trails already carries.

Its sibling RFC `0000-corelib-primitives` takes the genuinely-core surface
(`Range`, `String#succ`, the module-mixin primitives), which is a different thing
with a different anchoring contract. **The split is the point** — see
_Why this is not corelib_ below. **That RFC is `postponed`**: this one is the
active effort, and the primitives are scheduled after it rather than abandoned.

## Why

RFC `0074-i18n-parity` is the i18n gem's parity RFC. **32 of its 131 stories
(24%, 3,510 of 13,080 est-loc, 24 merged PRs) are not i18n at all** — they are a
port of `Date`/`DateTime`/`Time`. `packages/i18n/src/date.ts` is **2,554 lines**,
larger than `packages/i18n/src/backend/base.ts` (705), which is the actual gem
core.

That cluster has no anchor. `vendor/i18n/lib/i18n/` ships no date implementation,
and the thing being ported — `date-3.4.1/ext/date/date_parse.c` and
`ext/date/date_core.c` — is **not vendored anywhere in the repo**. `date.ts`'s
JSDoc cites the C source by line throughout (e.g. `date.ts:2213` cites
`date_core.c:186`) against a file no one can open.

Consequences, each verified:

- `parity:api` cannot resolve it. `scripts/api-compare/extra-surface.ts:12`
  walks _from each Ruby file_ to its expected TS file, so a TS file with no Ruby
  counterpart lands in the `rubyFile === null` slice (`extra-surface.ts:531`) —
  counted as extra surface, never compared method-by-method.
- `parity:test` cannot match it. Both test files
  (`date.trails.test.ts` 567 lines, `time.trails.test.ts` 123) use the
  `.trails.test.ts` suffix — TS-only extras, outside the compared population by
  construction.
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
is one import today and grows monotonically. **This is the cheapest this decision
will ever be.**

## Why this is not corelib

An earlier draft folded date into a single `corelib` package alongside `Range`
and the module primitives. That was wrong, and the reason is worth stating
because it is what keeps the two RFCs honest:

**`date` is a gem; `Range` and `Module#include` are the interpreter.** That is not
a taxonomy quibble — it decides what can be measured and how:

|                   | `packages/date` (this RFC)                             | `packages/corelib` (sibling RFC)                        |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Upstream          | `ruby/date` gem — own gemspec, `lib/`, `test/`         | `range.c`, `string.c`, `eval.c` — interpreter internals |
| Vendorable source | **Yes** — `lib/date.rb`, `ext/date/*.c`                | **No** — not distributable as a portable unit           |
| Vendorable tests  | **Yes** — `test/date/*.rb`                             | Only `ruby/spec` behavioral specs                       |
| `parity:api`      | **Yes**                                                | **Never**                                               |
| `parity:test`     | **Yes**                                                | Yes, against `ruby/spec`                                |
| Precedent         | `did-you-mean`, `globalid`, `nokogiri`, `rack`, `i18n` | none — genuinely new                                    |

Two different anchoring contracts. Folding them into one package would have made
"which contract applies here?" a rule contributors had to remember; **splitting
the packages makes it structural.** And it lets this RFC follow the
already-working vendored-gem precedent unchanged rather than inventing a
half-anchored hybrid.

## The contract

Three parts, and they are separable.

### 1. Port the gem's tests faithfully

`vendor/date/test/date/*.rb` is the specification. **Fidelity is measured by the
gem's test suite**, not by mirroring Ruby's internal representation. Test names
mirror the gem's names exactly — that is the `parity:test` matching key, and per
CLAUDE.md test names are never reworded to fit an implementation.

### 2. Temporal is the default return type

Where a Ruby method answers a temporal value, **the TS method answers a
`Temporal` type by default**:

| Ruby returns                        | trails returns by default                         |
| ----------------------------------- | ------------------------------------------------- |
| `Date`                              | `Temporal.PlainDate`                              |
| `DateTime`                          | `Temporal.PlainDateTime` (+ offset where carried) |
| `Time`                              | `Temporal.ZonedDateTime` / `Temporal.Instant`     |
| `Date#+`, `#advance`, `#next_day` … | the corresponding `Temporal` type                 |

Callers get Temporal without asking. This is the headline behavioral commitment
of the RFC.

#### What the `Temporal` seat cannot hold

Two values the gem-shaped object carries have no `Temporal` spelling. Both are
limits of the seat, not of the port: the gem-shaped object (`dNewByFrags` /
`dtNewByFrags`, and the `Date` / `DateTime` classes themselves) answers them
exactly, and the default return is _not_ narrowed for either case.

- **A pre-reform `::Date` with a Julian-only spelling raises.**
  `Temporal.PlainDate` is proleptic Gregorian, so every Julian leap day a
  Gregorian century rule removes — 1500-02-29, 1400-02-29, 1300-02-29 and so on
  back before the 1582 reform — has no value to convert to and `Date#to_date`
  (`date_core.c:8977-8981`, which is `self` in MRI and never raises) throws
  `Date::Error, "invalid date"`. Every static over the seat inherits this:
  `Date.civil`, `Date.jd`, `Date.ordinal`, `Date.commercial`, `Date.parse`,
  `Date.strptime`.
- **A sub-minute offset on a `::DateTime` truncates to the minute, moving the
  instant by up to 59 seconds.** `date_zone_to_diff` (`date_parse.c:523-528`)
  answers seconds — `Date._parse("2008-03-01T06:00:00-00:44:30")[:offset]` is
  `-2670` — while a `Temporal` offset time zone is minute-precision. The zone is
  spelled with `of2str` (`date_core.c:1973-1980`), whose `"%c%02d:%02d"` drops
  the same seconds, so the seat agrees with `DateTime#zone` (`"-00:44"`); the
  cost is that `ZonedDateTime#epochNanoseconds` names 06:44:00 UTC where MRI
  names 06:44:30. `DateTime#offset` / `#zone` on the gem-shaped object still
  hold the exact value, as `::Time`'s `number` offset does for the same reason.

### 3. The Ruby-shaped object stays available as an option

**A `Date` class still exists** — it is the gem's own API surface, it is what the
ported tests construct and exercise, and the parse/format machinery needs
somewhere to live. It is simply **not what the default entry points return**.

So: Temporal by default, the Ruby object on request. **The exact opt-in mechanism
is deliberately not fixed here** — an options argument, a parallel entry point, or
a conversion method are all viable, and the choice belongs to the scaffold and
substrate stories once the ported surface is visible. What this RFC fixes is the
_default_, and that a caller who needs Ruby-shaped behavior is not left without
it.

Ruby-shaped returns remain the default only where Temporal has no analogue and
the value is observable:

- `Date._parse` → a fragment object (Ruby answers a Hash; Temporal has no
  "partial date fields" analogue, and `{}` for no-match is load-bearing).
- `strftime` → `string`.
- UTC offsets → `number` seconds. **Required, not a shortcut:** Temporal offset
  time zones are minute-precision and MRI has sub-minute offsets;
  `time.ts:26-28` already keeps the offset as _"a number trails owns, so that
  MRI's sub-minute offsets are representable where a Temporal offset time zone
  (minute-precision) cannot hold them."_

**Expect assertion-value mismatches in `parity:test`, and expect them to be
benign.** A ported test whose Ruby form asserts
`assert_equal Date.new(2001,2,3), Date.parse("…")` compares a
`Temporal.PlainDate` on our side. `parity:test` matches on test _names_, so the
test still counts; the value-shape difference is the intended design, not drift.
The enrollment story records this explicitly so a later reader does not "fix" it.

### What this drops, and why it is safe

Stop re-implementing Ruby's internal representation — `#jd`/`#sg`
(`date.ts:2228-2233`), the `sg`-threaded calendar math (`date.ts:1715-2205`),
`Rational` offsets (`date.ts:431-471`). Keep Ruby fidelity only where it is
**observable** through the surfaces trails exposes: AR date/datetime/time columns
and casts, `I18n.localize`, `strftime`, AS date/time format helpers,
`to_date`/`to_time`.

| Ruby semantics                                                                                 | Temporal position                                               | Observable?                                                                                                                | Verdict                                                |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `Date` carries `(jd, sg)`; Julian before the reform, so 1582-10-10 / 1500-02-29 are real dates | `PlainDate` is proleptic ISO; those dates cannot be constructed | **No** — needs a pre-1582 date _and_ a non-default `start`; no AR column, `localize` call, or format helper passes `start` | **Drop**                                               |
| `Date::ITALY`/`ENGLAND`/`JULIAN`/`GREGORIAN` + `start` on every constructor                    | no analogue                                                     | **No** — `start` is never passed by any consumer                                                                           | **Drop** (keep constants inert if tests name them)     |
| `Date` vs `DateTime` vs `Time`                                                                 | `PlainDate` / `PlainDateTime` / `ZonedDateTime` / `Instant`     | **Yes** — `localize` routes to `date.formats` vs `time.formats` on whether the object answers `sec` (`base.ts:369`)        | **Keep**, map per the table above                      |
| Sub-minute UTC offsets                                                                         | offset zones are minute-precision                               | **Yes** — `%z`/`%Z`                                                                                                        | **Keep as `number`** — already solved, `time.ts:26-28` |
| `Rational` offsets / exact fractional-day arithmetic                                           | nanosecond integers, no rationals                               | **Barely** — no real zone, DB column, or format directive exposes sub-nanosecond precision                                 | **Drop the exactness guarantee**                       |
| `Date` arithmetic returning `Rational`                                                         | `Duration` / `PlainDate.add`                                    | **No** — no trails surface does fractional-day date arithmetic                                                             | **Drop**                                               |
| DST edges                                                                                      | Temporal forces explicit `disambiguation`                       | **Yes** — `TimeWithZone`, AR tz conversion                                                                                 | **Keep**, pin to Ruby's policy once, here              |
| `Time` fixed offset vs named zone                                                              | offset TZ vs IANA TZ                                            | **Yes** — `%Z`; `time.ts:1-7` gives this as the reason `time.ts` exists                                                    | **Keep**                                               |
| `Date._parse` fragment hash — partial results, `{}` for no match                               | `PlainDate.from` is strict ISO                                  | **Yes, maximally**                                                                                                         | **Keep in full** — the 1,566-line bulk                 |

### This continues an existing convention

`packages/activesupport/src/temporal.ts` is the single re-export point; **70
files** import `Temporal` from `@blazetrails/activesupport/temporal`. The
convention is **enforced**, not merely followed: `quoting.ts:162,219` (and the
sqlite3/mysql/pg quoting files) _throw_ on a JS `Date` —
`"quote: JS Date is not accepted — use a Temporal type"`. Declared value types
are already Temporal: `DateCastResult = Temporal.PlainDate | …`
(`activemodel/src/type/date.ts:15`), `DateTimeCastResult = Temporal.Instant | …`
(`type/date-time.ts:18`), `TimeWithZone` on `Temporal.ZonedDateTime`
(`time-with-zone.ts:108-327`). JS `Date` survives only as a _coercible input_
(`type/date.ts:41`, `type/date-time.ts:228`).

**`packages/i18n/src/date.ts` is the sole holdout** — a third dialect that
interoperates with neither Temporal nor JS `Date`, consistent with it having no
production consumer. This RFC removes the holdout as a _default_; it does not
introduce the convention.

## Not a burndown

The state-vs-boundary split of the 32 stories is **19 boundary / 11 state /
2 mixed**, and the line split agrees independently: **1,714 of 2,554 lines (67%)
is parse + format**, which is representation-agnostic and survives the Temporal
change untouched. Adopt Temporal for correctness and interop. It retires about a
third of the cluster.

**Vendoring is the load-bearing move; Temporal is the correctness move.** This
RFC sequences vendoring _first_ so the substrate migration is measured rather
than taken on faith.

## Vendoring

```ts
// vendor/sources.ts
{ name: "date",
  origin: { type: "git", url: "https://github.com/ruby/date.git", ref: "v3.4.1" },
  packages: [{ name: "date", libPath: "lib", testPath: "test/date" }] },
```

`v3.4.1` matches the version the port already cites.

**Highest-risk assumption, scoped to a spike (`date-c-source-extractor-decision`):**
`extract-ruby-api.rb` parses Ruby, not C, and the bulk of what is ported lives in
`ext/date/*.c` while `lib/date.rb` is comparatively thin. The stated fallback —
enroll `lib/date.rb` + `test/date/` normally and treat the C sources as a
vendored **read-anchor** with `UNPORTED_FILES` `pattern` entries — **still fixes
the presenting problem**, because `parity:test` over `test/date/` gives the
cluster a real, shrinking, self-terminating gate. No C-parser project is
required, and per the contract above the test suite is the fidelity measure
anyway.

### Spike result (`date-c-source-extractor-decision`, settled)

**Answer: (b), with one correction — no `UNPORTED_FILES` entries are needed or
possible.** Measured by running `scripts/api-compare/extract-ruby-api.rb`
directly against `vendor/date/lib` (`LIB_PATHS_JSON={"date":".../vendor/date/lib"}`),
which is exactly what enrollment would feed it:

```text
date: 2 classes, 0 modules, 12 public methods (1 internal)
```

That is the whole credited surface, and it is all of `lib/date.rb` (70 lines):
`Date#infinite?`, plus `Date::Infinity` — a `# :nodoc:` `Numeric` subclass —
with `initialize`, `d` (protected), `zero?`, `finite?`, `infinite?`, `nan?`,
`abs`, `-@`, `+@`, `<=>`, `coerce`, `to_f`. Nothing else in the gem is Ruby.
`ext/date/date_core.c` (10,064 lines) and `ext/date/date_parse.c` (3,086) hold
everything `packages/i18n/src/date.ts` (2,805 lines, ~42 public members and 101
module-local functions) actually ports.

So `parity:api` credits **~0%** of the port. Enrolling the source with
`compareApi: true` would compare `date.rb` against whatever TS file the path
rules point at and report the entire rest of the port as extra surface.

**No `UNPORTED_FILES` `pattern` entries are required.** That was the fallback's
assumption, and it is wrong in our favour: `extract-ruby-api.rb` globs
`**/*.rb` under the package's `libPath` (`extract-ruby-api.rb:2496`), so
`ext/date/*.c` never enters the compared population in the first place — there
is nothing to exclude. A `pattern` entry only matches Ruby source paths the
extractor already emitted.

**Consequences for `date-api-compare-enrollment`:**

- Keep `compareApi: false` for the `date` source. Flipping it buys 12 methods
  and costs a package-sized extra-surface report.
- `parity:test` is the gate. `vendor/date/test/date/` is 12 files and
  **145 `def test_` methods** — a real, shrinking, self-terminating population,
  which is what the cluster lacks today. Flip `compareTests` in
  `date-test-compare-enrollment`; that story is unblocked by this finding.
- The C sources stay a **read-anchor**: vendored, citable by `file:line` from
  JSDoc, outside every compared population by construction.
- A C extractor is **not** required and is not filed. Should the API-side gate
  ever be wanted, it would be its own RFC, not a story here.

## Temporal polyfill ownership

`packages/date` takes sole ownership of `@js-temporal/polyfill`. Today it is
declared **twice** — `packages/i18n/package.json:26` and
`packages/activesupport/package.json:98` — and only 3 files import it directly
(`activesupport/src/temporal.ts`, `i18n/src/{date,time}.ts`), the latter two
bypassing the chokepoint the other 70 call sites use.

This matters beyond tidiness. The codebase identifies Temporal values by
`instanceof` throughout (`type/date.ts:34`, `type/date-time.ts:226`,
`quoting.ts:155-158`). `instanceof` is identity-sensitive across module
instances, so two polyfill copies make `value instanceof Temporal.PlainDate`
return `false` for a valid value, and the quoting guard then falls through to
`throw new TypeError("can't quote …")` — silent and painful to diagnose. Both
specs are `^0.5.1` and pnpm currently dedupes them to one store path, so this
works **by version coincidence, not by design**.

`activesupport/src/temporal.ts` becomes a re-export from `@blazetrails/date`, so
**all 70 `@blazetrails/activesupport/temporal` import sites stay untouched** — a
one-file change, not a 70-file migration. `instantFrom(date: Date)` stays in
activesupport; it is a JS-`Date` interop helper and `packages/date` has no
opinion about JS `Date`.

The polyfill is also transitional (Temporal is Stage 3 and shipping natively); a
single owner makes its eventual removal one line in one package.

## Dependency direction — verified acyclic

- `packages/i18n/package.json` declares only `@js-temporal/polyfill`
  (+ optional `yaml`). `date.ts` imports nothing from activesupport; `time.ts`
  imports only `./date.js`. **The date layer needs nothing from AS today — no
  `Duration`, no `TimeZone`.** `packages/date` is a leaf.
- **i18n → date is structural, not circular, and the gem guarantees it.**
  `localize` duck-types on `strftime` and never names a `Date` type, so
  `packages/date` does not depend on i18n and cannot come to.
- `packages/date` does **not** depend on `packages/corelib`; the two are
  independent leaves.

## Integration: everything flows through `packages/date`

Porting the gem is half the job. The other half is that the rest of trails
actually _uses_ it — **as Rails does**, where nothing re-exports `Date`/`Time`
and nothing re-implements them. A file that needs them `require "date"`;
ActiveSupport's `core_ext` _reopens_ those classes rather than owning them.

In scope: **activesupport, activemodel, arel, activerecord.**
Out of scope: **actionpack** — its date handling is an HTTP-header wire-format
concern, tracked separately in RFC 0023
(`actionpack-http-cache-layer-uses-js-date`).

### 1. `Temporal` is imported from `packages/date`

`packages/date` wraps `@js-temporal/polyfill` and is the single place it is
declared. Today the substrate is re-exported from
`packages/activesupport/src/temporal.ts` (8 lines) and **153 files import it from
there** — activerecord 130 (64 non-test), activemodel 15 (9), arel 8 (3) —
so the substrate appears to belong to activesupport when it does not.

Converged in three slices so no PR is oversized and none overlap:
`route-temporal-imports-activemodel-arel`, `route-temporal-imports-activerecord`,
then `retire-activesupport-temporal-re-export`. `instantFrom(date: Date)`
(`temporal.ts:5-8`) stays in activesupport — `packages/date` has no opinion about
JS `Date`.

**The `instanceof` hazard is why single ownership is load-bearing, not cosmetic.**
Temporal values are identified by `instanceof` throughout (`type/date.ts:34`,
`type/date-time.ts:226`, `quoting.ts:155-158`), and `instanceof` is
identity-sensitive across module instances. Two polyfill copies make
`value instanceof Temporal.PlainDate` return `false` for a valid value, and the
AR quoting guard then falls through to `throw new TypeError("can't quote …")`.
Both `package.json`s currently say `^0.5.1` and pnpm dedupes them to one store
path — this works **by version coincidence, not by design.**

### 2. Date _functions_ flow through it too

Three places currently re-implement what the gem already does. Each is two
implementations of one Ruby method, neither measured against the other:

| Divergence                                                                                                                                                                | Rails' shape                                                            | Story                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| **Two `strftime`s** — `date.ts:102` (ported gem) and `time-with-zone.ts:397` (a second hand-rolled token table, `:400-420`)                                               | `TimeWithZone` has no `strftime`; it delegates to the underlying `Time` | `converge-time-with-zone-strftime-onto-date-package` |
| **Two parsers** — the anchored 1,566-line `_parse` machinery vs. AM's own `fallbackStringToDate` (`type/date.ts:92`) and `fallbackStringToTime` (`type/date-time.ts:278`) | `Type::Date#cast_value` calls `::Date._parse`                           | `activemodel-types-construct-through-date-package`   |
| **Per-adapter date rendering** — `postgresql-adapter.ts:3475`, `abstract/quoting.ts:155-160`, sqlite3/mysql quoting                                                       | `quoted_date` calls `to_fs(:db)`; PG overrides for BC and calls `super` | `activerecord-quoted-date-through-date-package`      |

The `_parse` divergence is the sharpest: **the most-tested code in the cluster is
not what ActiveModel uses to parse a date attribute.** Anchoring a parser nothing
calls would be a hollow win.

None of these change behavior. The quoting story in particular must emit
**byte-identical SQL** — any change there is a bug in the story, not a feature of
it.

## Disposition of RFC 0074's open date stories

Three of the four open stories are exactly the internal-state fidelity this RFC
demotes from the default. **Per CLAUDE.md this is supersession, not
ratification** — each closure cites the gap-table row that removes its referent,
each is re-derivable from this RFC if the decision is reversed, and none lands in
a deviation register.

| Story                                                 | Class    | Disposition                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `date-initialize-guess-style-fast-path` (in-progress) | state    | **Close as superseded — confirm with the holder first.** It ports `date_initialize`'s guess-style fast path, which decides JD vs ordinal vs civil _under a `sg`_; with `PlainDate` as the default return the branch has no referent. It is in-progress with a live worktree; do not close out from under a running agent |
| `datetime-new-start-preserves-the-receiver` (ready)   | state    | **Close as superseded** — definitionally about `start` propagation, dropped by rows 1–2                                                                                                                                                                                                                                  |
| `rt-rewrite-frags-rational-offset-exactness` (draft)  | state    | **Close as superseded** — chases exact `Rational` offsets; unobservable, and `time.ts:26-28` already settled the representable case                                                                                                                                                                                      |
| `date-strptime-seconds-frag-producers` (draft)        | boundary | **Keep, migrate here** — `strptime` is parsing, required under any substrate, and directly testable against `test/date/test_date_strptime.rb` once vendored. It _gains_ an anchor                                                                                                                                        |

**The 28 done stories stay done.** 19 of them are boundary fidelity carrying over
unchanged. This RFC re-homes and finally _anchors_ that work; it does not discard
it.

## Enrollment result (`date-test-compare-enrollment`, settled)

`compareTests` is on for the `date` source; `compareApi` stays off per the spike
above. The cluster now has the gate it has never had:

```text
date  —  0/138 tests (0%)  |  0/10 files  |  0 misplaced
```

**0% is the burndown baseline.** 138 is the credited Ruby population — the gem's
145 `def test_` methods less the 7 exclusions below — spread over 10 files
(`test_date.rb` 9, `test_date_arith.rb` 23, `test_date_attr.rb` 3,
`test_date_compat.rb` 1, `test_date_conv.rb` 12, `test_date_new.rb` 19,
`test_date_parse.rb` 26, `test_date_strftime.rb` 14, `test_date_strptime.rb` 13,
`test_switch_hitter.rb` 18). The two existing TS files stay `.trails.test.ts` —
TS-only extras, outside the compared population — so the number only moves when
a gem test is actually ported under its own name.

Excluded via `UNPORTED_FILES` (`scripts/api-compare/unported-files.ts`), each
with a reason at the entry, not by deleting a test:

- `test_date_ractor.rb` — Ractor is Ruby's actor-based parallelism; JS is
  single-threaded, same grounds as `promise.rb`.
- `test_date_marshal.rb` — Ruby's Marshal binary object format.
- `test_switch_hitter.rb`'s `test_marshal14/16/18/192` — per-test entries for the
  same Marshal wire format; the other 18 tests in the file stay counted. The
  entries name them `marshal14` … `marshal192`: `extract-ruby-tests.rb` strips
  the `def test_` prefix, and a `test_`-prefixed entry is a silent no-op.

Enrollment is **four** registrations, all landed together: `vendor/sources.ts`
(feeds `testPathsManifest()` → `extract-ruby-tests.rb`, plus its `sources.test.ts`
key-list expectation), `scripts/test-compare/extract-ts-tests.ts`
(`getPackageTestFiles()`), `scripts/test-compare/test-compare.ts` (`pkgDirs`),
and `scripts/test-compare/assertion-mismatch-mark.json`. The fourth has no local
gate that runs by default — `pnpm parity:test` passes without it while CI's
`Rails API/Test Comparison` job hard-fails on an unmarked package.

### Assertion-value mismatches here are expected and benign

Recorded at the enrollment site (`vendor/sources.ts`, the `date` package entry)
as well as here, because it is reversible-looking and is not a defect:

RFC 0088 returns `Temporal` types by default where Ruby returns
`Date`/`DateTime`/`Time`. So a ported test whose Ruby form asserts
`assert_equal Date.new(2001,2,3), Date.parse("2001-02-03")` compares a
`Temporal.PlainDate` on our side. **`parity:test` matches on test _names_, so
the test still counts**; the value-shape difference is this RFC's headline design
decision, not drift. **Do not "converge" a Temporal return back to a Ruby-shaped
one to silence a value mismatch** — that silently reverses the decision.

**Known consequence — resolved, and it costs nothing.** `date` is seeded at
`value: 0` in `scripts/test-compare/assertion-mismatch-mark.json`, and the
ratchet is only-shrink (`nextMark` takes `Math.min`, `assertion-ratchet.ts:126`),
so the seed can never be raised by `--write`. The concern was that the first
ported gem test asserting a Temporal value against a Ruby-shaped expectation
would red the ratchet at 0.

It does not, and the mechanism is structural rather than an exclusion: the
comparison is only ever made between two **fully literal** sides
(`assertion-values.ts`). `assert_equal Date.new(2001, 2, 3), …` and
`expect(…).toEqual(Temporal.PlainDate.from("2001-02-03"))` are method calls on
both sides, so `extract-ruby-tests.rb`'s `literal_token` and
`extract-ts-core.ts`'s `literalToken` each emit `null` and the kind is skipped
entirely. `date.value` therefore cannot rise for RFC 0088's intended shape, while
`assertionCount` and `kind` stay real gates — no exclusion list, no widened
baseline, and no reshaping of a Temporal return. Locked by a regression test in
`scripts/test-compare/assertion-values.test.ts` plus a note in the
`assertion-values.ts` header, so a future extractor that starts capturing
constructor calls has to confront it deliberately. Landed in trails #6149;
tracked as `date-assertion-value-mark-vs-temporal-returns`.

## Sequencing

Vendor and settle the extractor question, scaffold, move, **enroll — where the
cluster finally acquires a stopping condition** — then re-seat the default return
type on Temporal **last, so it is measured by the gates rather than taken on
faith.**

## Out of scope — filed separately

- `Range`, `String#succ`, and the module-mixin primitives → RFC
  `0000-corelib-primitives`, **postponed** so this port stays focused. Its 565
  lines remain unanchored in the meantime; that is a deferral, not a ratification.
- The `instanceof Date` residue in actionpack's HTTP cache layer → RFC 0023,
  `actionpack-http-cache-layer-uses-js-date`. **Not** the AR quoting sites, which
  are the convention being enforced.
- RFC 0074's four `i18n-inspect-*` stories → RFC 0023,
  `i18n-inspect-stories-are-ruby-object-inspect`.

## Constraints

- Each PR under the LOC ceiling; one story per PR; PRs branch from `main`, no stacking.
- Ported code lives at the path matching the vendored layout so `parity:api`
  resolves it.
- Test names must match the gem's test names for `parity:test`.

## Measuring this RFC (added 2026-08-09)

**The gate is `pnpm parity:test --package date`.** `parity:api` cannot measure
this package — `vendor/sources.ts:208` sets `compareApi: false` because the gem
is implemented in C and the Ruby extractor finds only 12 public methods in
`lib/date.rb` against ~2,800 lines of port. `test/date/` is the only fidelity
measure the date port has.

At the time this section was written that gate read **0/138 tests (0%), 0/10
files**, after 56 merged stories and ~4,900 LOC in `packages/date/src`. The
backlog had been growing because work was driven entirely by the _unbounded_
axis — reading 14,561 lines of `date_core.c` / `date_parse.c` /
`date_strftime.c` / `date_strptime.c` by hand and filing each divergence — while
the _bounded_ axis was untouched. Story creation tracked completion almost 1:1
every day from 2026-08-05 onward (5/8, 11/11, 18/19, 6/11, 5/5).

Two lanes, deliberately unequal:

- **Test lane (scheduled).** 16 `port-test-*` stories, one per Ruby test file
  with the four largest files pre-split at natural boundaries. These are the
  `ready` work and they are what moves `0/138`.
- **C-divergence lane (captured, not scheduled).** Findings from reading the C
  source still get filed against this RFC so the knowledge is not lost, but they
  are filed as **`draft`** and do not go `ready` while the test lane runs.
  Revisit once the 138 are green.

Paired stories that share one TS file (`port-test-date-parse-heuristic` ->
`port-test-date-parse-formats`, and the arith / new / strftime / strptime /
switch-hitter pairs) carry an explicit `deps` edge: both halves write the same
file, so they must not run in parallel.
