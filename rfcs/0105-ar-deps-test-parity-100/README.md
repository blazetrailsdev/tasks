---
rfc: "0105-ar-deps-test-parity-100"
title: "ActiveRecord + dependencies to 100% on the test-compare gate"
status: active
created: 2026-08-13
updated: 2026-08-31
owner: "@deanmarano"
packages:
  - activerecord
  - activesupport
  - activemodel
  - date
  - i18n
  - arel
  - globalid
  - did-you-mean
clusters:
  - boundary-and-measurement
  - name-gap
  # Retained for the assertion stories this RFC landed before the axis moved
  # to RFC 0132; no new story here takes it.
  - assertion-parity
related-rfcs:
  - "0132-ar-closure-assertion-parity"
  - "0098-activesupport-ar-closure-port"
  - "0101-activesupport-out-of-closure-surface"
  - "0072-api-compare-parity-burndown"
  - "0088-date-gem-port"
  - "0025-fidelity-verification-tooling"
  - "0023-surfaced-deviations"
priority: 10
---

# ActiveRecord + dependencies to 100% on the test-compare gate

## Scope split, 2026-08-31: the assertion axis moved to RFC 0132

Everything below was written when this RFC owned both axes. It no longer does.
The **name** gate is this RFC's remaining scope; the **assertion** gate — count,
kind and value, its ratchet, its enforcement flip, and its whole open queue —
moved to **RFC 0132 `ar-closure-assertion-parity`**, whose README carries the
current measurements.

What this RFC delivered on the name gate, measured 2026-08-31: **activerecord
8372/8372 (100%)**, activemodel 963/963, arel 739/739, date 137/137, globalid
131/131, did-you-mean 6/6. What remains: **activesupport 2547/2965 (85.9%)** and
**i18n 291/307 (94.8%)**, plus the counting-hygiene drafts. This RFC closes when
those two read 100%.

The assertion stories this RFC actually landed stay in its `stories/`
directory; they are the record of that work. Only the open queue moved. Read
the "Assertion parity is in scope" section below as the derivation of RFC
0132's problem statement, not as live scope.

## Problem

`pnpm parity:test` is the name-level fidelity gate: it matches every Rails test
method to a trails `it(...)` and reports `percent = (matched − skipped) / total`
(`scripts/test-compare/compare.ts:894-895`). ActiveRecord and its manifest
dependency closure are close on that gate but not done, and the two axes it
already measures but does not enforce — assertion count and assertion kind —
are far larger than the name gap.

Measured on `rfc-ar-deps-test-100-4449ba` (vendored Rails, `--cached` run,
2026-08-13; `stats.db`'s newest merged snapshot is PR #6392 / 2026-08-12 and
agrees):

| package       | matched | skipped | total | percent | remaining |
| ------------- | ------: | ------: | ----: | ------: | --------: |
| activerecord  |   8,232 |       6 | 8,407 |    97.9 |   **181** |
| activesupport |   2,795 |     291 | 2,955 |    84.7 |   **451** |
| activemodel   |     960 |       0 |   963 |    99.7 |         3 |
| date          |     124 |       0 |   137 |    90.5 |        13 |
| i18n          |     291 |       0 |   307 |    94.8 |        16 |
| arel          |     707 |       0 |   707 |   100.0 |         0 |
| globalid      |     131 |       0 |   131 |   100.0 |         0 |
| did-you-mean  |       6 |       0 |     6 |   100.0 |         0 |

`remaining = total − (matched − skipped)`; `matched` here is the JSON's
`totalMatched` (the terminal table prints `matched − skipped` in its first
column). **664 tests remain across the closure.** Two structural facts shape
the plan:

1. **The remaining work is not evenly spread.** All 181 of ActiveRecord's gap
   sits in one place: `migration/*` (169 tests across 12 files, of which
   `migration/compatibility_test.rb` alone is 57) plus 6 skipped
   `adapters/mysql2/mysql2_rake_test.rb` cases and 6 residual. activesupport's
   451 splits 291 `it.skip`/`todo` stubs (a file exists and holds the Rails
   name; the body is a stub) against 160 genuinely absent tests.
2. **The name gate is the smaller half of the truth.** ActiveRecord carries
   **1,977 assertion-count mismatches and 4,066 assertion-kind mismatches**
   across 199 and 283 files — 6,043 divergences _inside_ tests that already
   count as matched, versus 181 that don't. They are report-only
   (`compare.ts:606-663`) and only activerecord is measured at all
   (`ASSERTION_REPORT_PACKAGES`, `compare.ts:80`), so activesupport,
   activemodel, date and i18n have no assertion measurement whatsoever — their
   "100%" would be a weaker claim than AR's.

### Relationship to RFCs 0098, 0101, 0072, 0088

This RFC does **not** duplicate them; it is the same closure concept on a
different gate.

- **RFC 0098 `activesupport-ar-closure-port`** owns the **API** gate for the
  `require "active_support/…"` closure of `activerecord/lib` + `activemodel/lib`
  — 518 in-closure members, nine slots. Its closure derivation is the precedent
  this RFC follows on the test axis. Several 0098 slots (core-ext sweeps,
  time-with-zone residue, deprecation/logging internals, testing helpers) will
  incidentally close in-closure test-gate cases; the stories here that cover the
  same Rails files carry a prose note and are sequenced after the boundary work,
  not restated.
- **RFC 0101 `activesupport-out-of-closure-surface`** owns the members AR never
  loads (cache stores, XmlMini) — and already carries _test-enrollment_ stories
  (`enroll-cache-store-compression-behavior`,
  `wire-cache-logging-behavior-into-helpers`,
  `port-the-remaining-cache-store-behavior-cases`, …). The out-of-closure
  activesupport test remainder is 201 tests, ~125 of them cache behaviors that
  0101 already owns. This RFC files exactly one reconciliation story that audits
  the out-of-closure remainder against 0101's story list and files the gaps
  **into 0101**, not here.
- **RFC 0072** holds the out-of-closure exclusions and the closure SKIP_GROUPS
  triage; nothing here widens either.
- **RFC 0088 `date-gem-port`** (active) owns date's 13 remaining via four ready
  stories (`port-test-date-strftime-different-format`,
  `port-test-date-parse-formats-iso8601-family`,
  `port-test-date-parse-heuristic-remainder`,
  `port-test-date-sub-class-propagation`). This RFC files **no** date stories
  and treats those four as an external prerequisite.
- **RFC 0074 `i18n-parity` is closed**, so i18n's 16 remaining are unowned and
  are filed here.
- **RFC 0023** carries the draft
  `reenroll-fixtures-tests-stale-unported-exclusion` (est-loc 200), which is
  exactly the registry fix described below. This RFC does not restate it; it
  owns the _porting_ that lands after it.

## The activesupport test boundary

The API-gate closure in 0098 is a **member** list. The test gate needs a
**test-file** boundary, and `vendor/rails/activesupport/test/` is organized by
feature, not by consumer, so the mapping is not automatic.

### Derivation (done, reproducible)

Transitively walking `require "active_support/…"` from every file in
`vendor/rails/activerecord/lib` + `vendor/rails/activemodel/lib` yields 62 seed
requires and a **144-file closure** under
`vendor/rails/activesupport/lib/active_support/`. Mapping those 144 lib files
onto the 164 Rails activesupport test files by three rules —

- **R1 path**: `<test path minus _test.rb>` (plus the `_ext`-stripped and
  pluralized variants) names a closure file. e.g.
  `core_ext/numeric_ext_test.rb` → `active_support/core_ext/numeric`.
- **R2 dir**: the same stem names a directory containing at least one closure
  file. e.g. `core_ext/hash_ext_test.rb` → `active_support/core_ext/hash/*`.
- **R3 basename**: the stem's basename equals a closure file's basename at a
  different path. e.g. `time_zone_test.rb` →
  `active_support/values/time_zone.rb`, `share_lock_test.rb` →
  `active_support/concurrency/share_lock.rb`.

— splits the package as:

| bucket         | test files | Rails tests | remaining | of which skip-stubs |
| -------------- | ---------: | ----------: | --------: | ------------------: |
| **in closure** |         73 |       1,883 |   **250** |                 200 |
| out of closure |         91 |       1,072 |   **201** |                  91 |

R3 is the imprecise rule (it maps `core_ext/pathname/blank_test.rb` onto
`core_ext/date/blank.rb` on basename alone), which is why the boundary is _not_
shipped as a heuristic: the first story lands R1/R2 as code plus a **reviewed,
checked-in alias table** for everything R1/R2 misses, and a guard that fails
when an activesupport test file is neither auto-derived nor listed. That is the
mechanical check — a reviewer runs one command and gets in/out for any file,
with no appeal to judgment.

### What happens to the out-of-closure files: nothing

**No test file is excluded to make this number reach 100.** The forecast doc's
Part 1 finding stands — the unported registry grew 18 entries (May) → ~200
(Aug), and every growth step shrinks a denominator — and this RFC does not add
to it for scope reasons. Three arguments, in order of weight:

1. **Exclusion would delete earned work, not just future work.** The 91
   out-of-closure files hold 1,072 Rails tests of which only 201 remain: 871 are
   already matched and would vanish from the numerator and denominator alike.
   The "gain" is a 201-test denominator cut dressed up as an 871-test scope cut.
2. **The out-of-closure remainder is already owned and is small.** ~125 of the
   201 are cache behaviors under RFC 0101. Excluding them would retire stories
   that exist and are scheduled.
3. **The boundary's real job is prioritization, not accounting.** What the AR
   closure buys is a _sub-metric_: "AR-closure test parity" reported beside the
   whole-package percent, so an agent picking work can see which of the 451 is
   on ActiveRecord's critical path. Story 2 adds that line to `parity:test`
   output and to the JSON. The headline `activesupport 84.7%` stays whole and
   keeps meaning what it means today.

The one exclusion this RFC does add is of the opposite kind:
`migration/compatibility_test.rb` (57 tests). `ActiveRecord::Migration[x.y]` /
`Compatibility::V*` is **won't-do by explicit maintainer decision** — PR #5070
shipped a complete, CI-green implementation and was closed unmerged ("we have no
backwards compatibility necessary since there never were previous versions of
trails"); story `c1-schema-dumper-migration-version-compat` (RFC 0030) was
closed on the same grounds. That is an exclusion for a surface that will never
exist, which is the honest case. The stale fixtures row is the dishonest case —
the surface shipped (`packages/activerecord/src/fixtures.ts`, 1,461 LOC;
`test-fixtures.ts`, 584; a 133-entry canonical fixture corpus; CLAUDE.md names
`fixtures({ … })` as _the_ canonical test surface) and the exclusion reason says
users "won't ship YAML fixtures". The distinction the reviewer applies is: _does
the trails surface exist?_ If yes, the tests belong in the denominator.

### The fixtures finding, verified independently

`scripts/parity/unported-files/unscoped.ts:77-99`, three rows,
counted against `vendor/rails/activerecord/test/cases/`:

| row                | testFile                | Rails tests |
| ------------------ | ----------------------- | ----------: |
| `fixtures.rb`      | `/fixtures_test.rb`     |         153 |
| `fixture_set`      | `fixture_set/`          |          14 |
| `test_fixtures.rb` | `test_fixtures_test.rb` |           5 |

**172 tests**, the single largest test-gate exclusion in the repo. Reinstating
them moves AR from 97.9% to ≈96.0% before any porting — the number goes _down_,
which is the point. Our side already holds 93 `it(...)` cases across
`fixtures.test.ts` (32), `test-fixtures.test.ts` (55) and
`naked-fixtures.test.ts` (6), so a large share should name-match on first
enrollment; the true post-enrollment gap is unknown until the rows come out,
which is why the first porting story is scoped to _measure then port_.

**The substring bug, stated precisely.** The forecast doc reports the unanchored
`"fixtures.rb"` pattern as also matching `test_fixtures.rb` and
`encryption/encrypted_fixtures.rb`. That is true, but of the **`pattern`** field,
which feeds `isSourceUnported` (`unported-files/index.ts:36-43`, the api-compare
source axis) — the `testFile` field on that row is already anchored
(`/fixtures_test.rb`), so the test denominator is not affected by the shadow.
The fix is still real and one line (`/fixtures.rb`), and it belongs with the
re-enrollment.

## Assertion parity is in scope — SUPERSEDED by RFC 0132

> Kept as the derivation that produced RFC 0132. The plan it describes is that
> RFC's, not this one's; its numbers are the 2026-08-13 measurement.

"100% test compare" in this RFC means **name parity and assertion parity**, not
name-matching only.

The ratchet already exists — RFC 0025's `assertion-mismatch-ratchet` shipped in
PR #5790 with `scripts/test-compare/assertion-mismatch-mark.json`
(activerecord: 1,987 / 4,069 / 54; every other package 0) and
`pnpm parity:test:assertions`. So debt cannot grow. What is missing is the burn
and the coverage:

- **Burn.** 1,977 count + 4,066 kind + 49 value = 6,043 divergences over 283
  files. The top 45 files carry 4,164 of them (69%); by Rails source area:
  `cases/*` root 3,290, `associations/` 1,056, `adapters/` 855, `encryption/`
  149, `migration/` 129, `relation/` 127, `connection_adapters/` 107,
  `scoping/` 102, `validations/` 101, `tasks/` 79. This RFC files 37 burn-down
  stories clustered by Rails source area (below), each a named file list with a
  divergence budget.
- **Coverage.** `ASSERTION_REPORT_PACKAGES` is `{activerecord}`. Widening it to
  the whole in-scope closure is a one-line change that **will surface a new pile
  of mismatches that does not exist as measured work today** — the closure has
  ~4,700 matched non-AR tests and AR's mismatch density is ~0.73
  divergences/matched test, so the honest expectation is **low thousands**, and
  the mark file must be seeded at the measured values in the same PR. That is
  costed as its own story (widen + seed) plus a sizing story that files the burn
  stories once the real distribution is known — not guessed at here.
- **Enforcement.** The flip from "mark, only-shrink" to "hard zero" (the path
  `gates.ts` already took: advisory → ratchet → zero) belongs in this RFC as its
  last story, gated on every counter reaching 0. A number that only counts when
  someone reads the report is the same problem as an exclusion nobody revisits.

## Approach

Sequenced in four waves. Every story is standalone from `main`, non-overlapping
in files with its siblings, sized to the repo's normal PR ceiling.

1. **Boundary & measurement** (wave 1). The closure manifest + guard, the
   sub-metric, the fixtures pattern anchoring, the compatibility-test exclusion,
   the `ASSERTION_REPORT_PACKAGES` widening + mark seed, and the sizing story
   that turns the widened measurement into filed work. Everything else depends
   on wave 1 landing.
2. **Name-gap burndown** (wave 2). AR's migration cluster, the fixtures
   port that follows RFC 0023's re-enrollment, the activesupport in-closure gap
   (with a skip-stub triage first — many of the 291 stubs are thread/fork/GVL
   cases that must become reasoned case-level exclusions, not ports), the
   out-of-closure reconciliation into 0101, i18n's 16, activemodel's 3.
3. **Assertion burndown** (wave 3). 37 stories over the AR assertion
   distribution, clustered by Rails source area.
4. **Enforcement** (wave 4). Hard-zero flip.

### Alternatives considered

- **Exclude the out-of-closure activesupport test files** (the shape the prompt
  named as a live option). Rejected on the arithmetic above: it deletes 871
  already-matched tests to remove 201 unmatched ones, and it would retire RFC
  0101 stories that exist and are scheduled. It is also precisely the pattern
  `docs/infrastructure/parity-convergence-forecast.md` Part 1 flags — a
  denominator cut that reads as progress.
- **Scope the whole gate to the closure** (report only the closure percent and
  drop the package percent). Rejected: the headline number would silently change
  meaning, and every historical `stats.db` row would become incomparable to the
  new one. The sub-metric adds a number instead of redefining one.
- **Name-matching only, assertions as a follow-up RFC.** Rejected: AR's
  assertion divergences (6,092) outnumber its name gap (181) by 34×, and a 100%
  that ships beside 4,066 unexamined assertion-kind mismatches is the number
  nobody believes. It is in this RFC's definition of done.
- **Port `Migration[x.y]` rather than exclude it.** Rejected by maintainer
  decision already on the record (PR #5070, closed unmerged); re-litigating it
  is out of scope.

### Priority

The RFC's own `priority: 2` is the default every story inherits; 57 of the 65
carry `priority: null` and take it. Eight are overridden, and only where leaving
them at the default would schedule the work wrong:

**Higher (`priority: 1`)** — these three unblock or resize everything else, and
two of them are among the cheapest stories in the RFC:

- `derive-ar-closure-test-manifest` — six wave-2 stories depend on it, and the
  boundary has to exist before anyone ports against it.
- `exclude-migration-compatibility-tests-as-wont-do` — ~90 LOC that settles 57
  tests, a third of ActiveRecord's whole remaining gap. Landing it first means
  every later migration story measures against a stable denominator.
- `widen-assertion-report-packages-and-seed-mark` — the RFC's largest unknown is
  how much assertion debt the non-AR packages carry. Until this runs, the plan's
  true size is a guess.

**Lower (`priority: 3`)** — lowest yield per PR, so they should be picked last:

- `assertions-tail-root-5c` (12 divergences), `assertions-tail-root-6b` (19),
  `assertions-tail-adapters-3c` (30), `assertions-tail-root-6a` (41) — 102
  divergences across 59 files between them, versus 336 in
  `assertions-has-many-associations` alone.
- `flip-assertion-mismatch-gate-to-hard-zero` — terminal by construction; its
  `deps` already block it, and the priority makes that intent visible in
  `pnpm tasks ready` output rather than only in the graph.

Everything else — all the porting stories and the 33 remaining assertion
clusters — sits at the RFC default and is picked in whatever order agents are
free, which is correct: they are independent and non-overlapping by design.

### Story sizing: gate units, not LOC, for the porting waves

CLAUDE.md's PR ceiling counts additions + deletions with tests included. For
waves 1 and 4 that is the right meter and it stays in force — those stories edit
`scripts/` tooling, which is app code and reviews like app code.

For waves 2 and 3 it measures the wrong thing, and this RFC does not pretend
otherwise: **those stories were sized by gate units, with the LOC ceiling
waived.**

- **Wave 3** is sized by **assertion divergences (≤190 per story) and files
  (≤18 per story)**. The divergence is the unit of review work — one hunk,
  checked against one Rails assertion — and it is what the gate itself counts.
- **Wave 2** is sized by **missing Rails tests per story**, the unit
  `pnpm parity:test` counts.
- The `est-loc` on every wave-2 and wave-3 story is **derived from those budgets,
  not the constraint**. Treat it as a scheduling hint; a story that lands at 700
  LOC of mechanical assertion edits inside its divergence budget is correctly
  sized, not oversized.

The ≤18-file cap is the reviewability half of the rule and is not waived: a
diff spread over 50 files is hard to review however small each hunk is. That cap
is why `assertions-tail-adapters-3` and `-root-5/6` were repacked.

**Why not one PR per Rails test file** (the obvious alternative): the divergence
distribution is long-tailed at both ends. 61 of the 286 files carry 1–2
divergences each — 1.5% of the work, but 61 PRs, each paying a full three-lane
CI run and a review round — while the five heaviest files carry 201–400
divergences each (21% of the work) and would each still need splitting. Median
file is 7 divergences. Per-file is simultaneously too granular for half the
corpus and too coarse for its head, and it multiplies CI cost roughly 4.6× (65
stories → ~300 PRs) in a repo with no spare runners. The one real benefit of
per-file PRs — no sibling conflicts, cleanly attributable parity movement — is
already bought by giving every story a disjoint file list.

This is a per-RFC sizing decision, not a proposal to change how the ceiling works
repo-wide. Test lines are not free to review _here_ in particular: a name-matched
test that asserts the wrong thing is precisely the defect this RFC exists to
burn down, so an assertion hunk is where a reviewer must actually look.

### Sequencing and parallelism

Wave 1 lands first and is small (7 stories, ~1,190 est-LOC); everything else
depends on it only through the manifest and the widened measurement. Waves 2 and
3 then run **in parallel** — they touch disjoint files (wave 2 adds missing
tests in `migration/*`, `fixtures*`, `core-ext/*`, `i18n`, `activemodel/type`;
wave 3 edits assertions inside already-matched AR tests elsewhere) — except for
`assertions-migration-cluster`, which carries `deps` on all seven
`port-migration-*` stories — burning down an assertion table measured against a
file those stories are still adding tests to would be wasted work. Wave 4 is
gated on every assertion story via `deps`, so it cannot surface in
`pnpm tasks ready` early; because the widened-package burndown stories do not
exist yet, `size-and-file-assertion-work-for-widened-packages` carries an
acceptance criterion to append each story it files to the flip story's `deps`
before it closes.

Cross-RFC ordering uses `deps` with the other RFC's story id, not `deps-rfc`:
story ids resolve globally in the dep graph (`scripts/validate-lib.mjs:86-110`)
and 29 such edges already exist in this repo, whereas `deps-rfc` blocks until the
named RFC is `closed` — which never happens for standing catch-alls like
`0023-surfaced-deviations`. That is how `measure-fixtures-enrollment-gap` is
gated on RFC 0023's `reenroll-fixtures-tests-stale-unported-exclusion`.

### What would invalidate this plan

- **Vendored Rails bumps.** Every count here is against the currently vendored
  tree; `pnpm vendor:fetch` moving forward changes denominators. The wave-1
  guard is what turns that from a silent drift into a failing check.
- **The widened assertion measurement coming in far above the low-thousands
  estimate.** `size-and-file-assertion-work-for-widened-packages` exists to
  re-scope rather than absorb it, and that re-scope may add stories to this RFC.
- **Allocation, not throughput.** The forecast measured ~0.75 in-scope tests
  converged per merged PR against ~300 merged PRs/week repo-wide; this RFC does
  not change agent allocation, and no sequencing fixes that.

### Reproduction

```bash
pnpm parity:test                                    # per-package name parity
pnpm parity:test -- --package activerecord --assertions          # per-file mismatch tables
pnpm parity:test -- --package activerecord --assertions --missing  # per-test rails N vs trails M
pnpm parity:test -- --package activesupport --json   # writes convention-comparison.json
```

The closure derivation: transitively collect `require "active_support/…"` from
`vendor/rails/activerecord/lib/**/*.rb` + `vendor/rails/activemodel/lib/**/*.rb`,
resolving each against `vendor/rails/activesupport/lib/`; 62 seeds, 144 files.
Story `derive-ar-closure-test-manifest` turns exactly that walk into checked-in
tooling.

## Stories

**Wave 1 — boundary & measurement** (7 stories, ~1190 est-LOC)

- `anchor-fixtures-source-pattern` — Anchor the unported `fixtures.rb` source pattern so it stops shadowing two siblings (80 LOC)
- `derive-ar-closure-test-manifest` — Derive the AR-closure activesupport test manifest and guard it (320 LOC)
- `document-the-100-percent-definition-in-contributing` — Write down what 100% test compare means, and what may and may not be excluded (120 LOC)
- `exclude-migration-compatibility-tests-as-wont-do` — Exclude migration/compatibility_test.rb as won't-do (Migration[x.y] is not a trails goal) (90 LOC)
- `report-ar-closure-sub-metric-in-parity-test` — Report an AR-closure sub-metric beside the whole-package activesupport percent (220 LOC)
- `size-and-file-assertion-work-for-widened-packages` — Size the newly measured assertion debt and file its burndown stories (160 LOC)
- `widen-assertion-report-packages-and-seed-mark` — Measure assertion parity for the whole in-scope closure, not just activerecord (200 LOC)

**Wave 2 — name gap** (20 stories, ~7610 est-LOC)

- `measure-fixtures-enrollment-gap` — Measure the real fixtures gap once the stale exclusion lifts (150 LOC)
- `port-activemodel-type-temporal-cases` — Port activemodel's three remaining type/date, type/time and type/date_time cases (200 LOC)
- `port-core-ext-hash-ext-remaining-cases` — Port core_ext/hash_ext_test.rb's remaining cases (49) (500 LOC)
- `port-core-ext-numeric-and-time-ext-cases` — Port core_ext/numeric_ext_test.rb and time_ext_test.rb (36) (450 LOC)
- `port-core-ext-string-array-and-json-cases` — Port core_ext/string_ext, array/conversions and json/encoding cases (39) (450 LOC)
- `port-date-and-time-compatibility-and-zone-cases` — Port date_and_time compatibility, date/date_time ext and zone cases (46) (500 LOC)
- `port-fixture-set-file-and-test-fixtures-cases` — Port fixture_set/file_test.rb and test_fixtures_test.rb (19 tests) (350 LOC)
- `port-fixtures-test-cases-first-half` — Port fixtures_test.rb, first half (500 LOC)
- `port-fixtures-test-cases-second-half` — Port fixtures_test.rb, second half (500 LOC)
- `port-i18n-remaining-cases` — Port i18n's 16 remaining tests (RFC 0074 is closed; they are unowned) (400 LOC)
- `port-inflector-dependencies-and-in-closure-residue` — Port inflector, transliterate, dependencies/autoload and the in-closure residue (~60) (500 LOC)
- `port-migration-column-attributes-and-positioning` — Port migration/column_attributes_test.rb and column_positioning_test.rb (18 missing) (400 LOC)
- `port-migration-constraints-and-residue` — Port the migration constraint and residue cases (8 missing) (300 LOC)
- `port-migration-create-join-table-test` — Port migration/create_join_table_test.rb (19 missing) (400 LOC)
- `port-migration-foreign-key-residue-and-mysql2-rake-skips` — Close migration/foreign_key_test.rb's last case and the six mysql2 rake skips (300 LOC)
- `port-migration-index-test` — Port migration/index_test.rb (26 missing) (450 LOC)
- `port-migration-references-index-and-schema-definitions` — Port migration/references_index_test.rb and schema_definitions_test.rb (19 missing) (400 LOC)
- `port-migration-references-statements-test` — Port migration/references_statements_test.rb (21 missing) (400 LOC)
- `reconcile-out-of-closure-activesupport-test-remainder` — Reconcile the out-of-closure activesupport test remainder against RFC 0101 (180 LOC)
- `triage-activesupport-in-closure-skip-stubs` — Triage activesupport's 291 skip stubs into port-or-exclude dispositions (280 LOC)

**Wave 3 — assertion burndown (activerecord)** (37 stories, ~10762 est-LOC)

- `assertions-associations-and-eager` — associations_test and eager-loading assertion parity (396 LOC)
- `assertions-attribute-methods-test` — attribute_methods assertion parity (289 LOC)
- `assertions-autosave-association` — autosave association assertion parity (408 LOC)
- `assertions-base-test` — base_test assertion parity (336 LOC)
- `assertions-belongs-to-has-one-inverse` — belongs_to / has_one / inverse assertion parity (360 LOC)
- `assertions-calculations-test` — calculations assertion parity (291 LOC)
- `assertions-database-tasks-and-schema-dumper` — database tasks and schema dumper assertion parity (259 LOC)
- `assertions-enum-dirty-strict-loading` — enum, dirty and strict_loading assertion parity (332 LOC)
- `assertions-finder-test` — finder_test assertion parity (380 LOC)
- `assertions-habtm-and-nested-through` — habtm and nested-through assertion parity (200 LOC)
- `assertions-has-many-associations` — has_many association assertion parity (537 LOC)
- `assertions-has-many-through-cluster` — has_many :through assertion parity (307 LOC)
- `assertions-migration-cluster` — migration assertion parity (348 LOC)
- `assertions-persistence-and-nested-attributes` — persistence and nested-attributes assertion parity (337 LOC)
- `assertions-postgresql-geometric-array-and-adapter` — postgresql geometric/array/adapter assertion parity (200 LOC)
- `assertions-postgresql-range-and-schema` — postgresql range and schema assertion parity (273 LOC)
- `assertions-reflection-primary-keys-multiparameter` — reflection, primary keys and multiparameter assertion parity (259 LOC)
- `assertions-relations-test` — relations_test assertion parity (398 LOC)
- `assertions-scoping-relation-batches-insert-all` — scoping, relation, batches and insert_all assertion parity (408 LOC)
- `assertions-sqlite3-adapter` — sqlite3 adapter assertion parity (200 LOC)
- `assertions-tail-adapters-1` — assertion parity tail: adapters files, batch 1 (304 LOC)
- `assertions-tail-adapters-2` — assertion parity tail: adapters files, batch 2 (296 LOC)
- `assertions-tail-adapters-3a` — assertion parity tail: adapters files, batch 3a (200 LOC)
- `assertions-tail-adapters-3b` — assertion parity tail: adapters files, batch 3b (200 LOC)
- `assertions-tail-adapters-3c` — assertion parity tail: adapters files, batch 3c (200 LOC)
- `assertions-tail-associations-1` — assertion parity tail: associations files, batch 1 (200 LOC)
- `assertions-tail-root-1` — assertion parity tail: root files, batch 1 (289 LOC)
- `assertions-tail-root-2` — assertion parity tail: root files, batch 2 (292 LOC)
- `assertions-tail-root-3` — assertion parity tail: root files, batch 3 (289 LOC)
- `assertions-tail-root-4` — assertion parity tail: root files, batch 4 (302 LOC)
- `assertions-tail-root-5a` — assertion parity tail: root files, batch 5a (200 LOC)
- `assertions-tail-root-5b` — assertion parity tail: root files, batch 5b (200 LOC)
- `assertions-tail-root-5c` — assertion parity tail: root files, batch 5c (200 LOC)
- `assertions-tail-root-6a` — assertion parity tail: root files, batch 6a (200 LOC)
- `assertions-tail-root-6b` — assertion parity tail: root files, batch 6b (200 LOC)
- `assertions-transactions-locking-and-pool` — transactions, locking and connection-pool assertion parity (404 LOC)
- `assertions-validations-and-encryption` — validations and encryption assertion parity (268 LOC)

**Wave 4 — enforcement** (1 stories, ~200 est-LOC)

- `flip-assertion-mismatch-gate-to-hard-zero` — Flip the assertion-mismatch gate from ratchet to hard zero (200 LOC)

**65 stories, ~19762 est-LOC total.**

## Done means

`pnpm parity:test` on `main`, with no new entry in
`scripts/parity/unported-files/` beyond the single
`migration/compatibility_test.rb` row this RFC sanctions:

- **`activerecord 100%`**, on a denominator that **includes** `fixtures_test.rb`,
  `fixture_set/file_test.rb` and `test_fixtures_test.rb` (≈8,522 total after
  re-enrollment and the compatibility exclusion, up from today's 8,407).
- **`activesupport 100%`** for the whole package — the AR-closure sub-metric and
  the package percent both read 100. (Out-of-closure cases converge through RFC
  0101; this RFC's gate does not pass until they do.)
- **`activemodel 100%`, `date 100%`** (via RFC 0088), **`i18n 100%`**, and
  `arel` / `globalid` / `did-you-mean` still at 100.
- `skipped = 0` for every package above. A stub is not a pass; where a Rails
  test genuinely cannot exist in TypeScript it leaves as a reasoned case-level
  `tests:` exclusion, never as an unskipped stub or a whole-file row.

Assertion parity is **not** part of this RFC's done condition any more; it is
RFC 0132's (`ar-closure-assertion-parity`). This gate is name parity.
