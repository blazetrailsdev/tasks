---
rfc: "0000-rails-8-0-5-1-upgrade-workflow"
title: "Rails 8.0.5.1 upgrade workflow: the first bump of the source of truth, the bump ledger that keeps main green, and the scoping of 8.1"
status: draft
created: 2026-10-13
updated: 2026-10-13
owner: "@deanmarano"
packages:
  - "scripts"
  - "arel"
  - "activemodel"
  - "activerecord"
  - "activesupport"
  - "actionpack"
  - "actionview"
  - "activejob"
  - "trailties"
  - "rack"
  - "rack-session"
  - "bcrypt"
  - "pg"
  - "sqlite3"
clusters:
  - tooling
  - entry
  - flip
  - post-flip
  - close
related-rfcs:
  - "0159-versioned-vendor-layout"
  - "0175-activerecord-test-parity-100"
  - "0100-package-size-and-publish-shape"
  - "0025-fidelity-verification-tooling"
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Rails 8.0.5.1 upgrade workflow

## Summary

trails mirrors Rails `v8.0.2`. This RFC plans its first move of that source
of truth: to **`v8.0.5.1`** (`beef74d4cebf42a01cd1df79e9de00df725b64fd`, tagged
2026-07-29), the last release of the 8.0 line. It decides sequence, gating and
tagging. It ports no Rails code and holds no porting stories: the burn-down is
one story here that generates a separate RFC after the flip.

The RFC was first drafted for `v8.1.4`. The owner ruled on 2026-10-13 to do
`v8.0.5.1` first, as its own upgrade, and to plan 8.1 afterwards from what
this one teaches. The 8.1 measurements are kept in § 8, and the last story
here writes the 8.1 RFC.

The mechanical procedure exists (vendor/README.md § "Upgrading a source
(bumping `ref`)", designed by RFC 0159). What it does not answer is how `main`
stays green between the one-line `ref` bump and the last re-verified body. A
dry run of every gate against the v8.0.5.1 manifests shows the bump turns
**ten CI gates red at once**, on **141 drifted and 12 stale body pins across
82 Ruby files**, and no baseline may widen to absorb it.

The recommendation is one flip PR on `main` followed by a burn-down on `main`,
made possible by a **bump ledger**: a committed, only-shrink list of the ported
units whose upstream definition changed, which scopes the per-unit ratchets off
those units until each is re-verified. The ledger (Open question 1) and the
branch policy (2) are the owner's to rule on. Every dry run, flip and ledger
count is kept in the stats DB (§ 7).

## Motivation

### Where we are

Measured on trails `25cc7a1876` on 2026-10-13 with `API_COMPARE_FORCE=1 pnpm
parity:api` and `pnpm parity:test`:

| Package       | Methods   | Tests     | Unpinned matched bodies |
| ------------- | --------- | --------- | ----------------------- |
| arel          | 1052/1052 | 739/739   | 0                       |
| activemodel   | 821/821   | 1037/1037 | 0                       |
| activerecord  | 6980/6980 | 8801/8830 | 178                     |
| activesupport | 2039/2187 | 2995/3325 | 82                      |
| actionpack    | 2658/2738 | 2866/3686 | 174                     |
| actionview    | 1215/1482 | 728/2507  | 299                     |
| activejob     | 5/369     | 0/396     | 3                       |
| trailties     | 789/1660  | 223/2419  | 162                     |

actionpack is the sum of `actiondispatch`, `actioncontroller`,
`abstractcontroller` and `actionpackversion`. `body-pins.json` holds 10,737
pins, 9,786 of them at `ref: v8.0.2`. Every package is at version `0.1.0`,
nothing is published, and trails has no release tags.

### What the bump does to `main` today

None of this was assumed. Each gate in ci.yml's `rails-comparison` job was run
against the v8.0.5.1 Ruby manifests (the method is in § "How the size was
measured"). Percentages are not gated; ratchets are.

| Gate (ci.yml step)                                                                                                                          | Result at the flip commit                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Body-pins gate                                                                                                                              | **red**: 141 DRIFT, 12 STALE (`lint-body-pins.ts` exits 1 on either) |
| Call-mismatches ratchet                                                                                                                     | **red**: 22 new rows                                                 |
| Ratchet baseline reseed drift                                                                                                               | **red**: follows from the 22 new rows                                |
| Call-argument ratchet                                                                                                                       | **red**: 10 new shape rows, 7 naming failures                        |
| Missing-throw arm ratchet                                                                                                                   | **red**: 2 dimensions grow                                           |
| Parameter-name ratchet                                                                                                                      | **red**: 2 dimensions grow                                           |
| Block-parameter ratchet                                                                                                                     | **red**: 4 dimensions grow                                           |
| Test comparison (`--gates --check`)                                                                                                         | **red**: 1 activerecord gate-mismatch against a hard zero            |
| Assertion-mismatch ratchet                                                                                                                  | **red**: 7 package/dimension marks grow (actioncontroller 92 → 99)   |
| Vendor citations (Preflight)                                                                                                                | **red** until `pnpm vendor:recite` runs: 103 citations in 47 files   |
| Receipt audit, ruby-compat calls, extra-surface                                                                                             | green here; red on `v8.1.4` (§ 8)                                    |
| API comparison, privates, arity and inheritance excludes, predicate-kind, inlined-from, ambiguous-parent, dependency lint, AR-closure guard | green                                                                |

Not exercised by the dry run, because each reads the active version directory
or runs real Rails: the rails-private JSDoc lint and its runtime artifact, the
method-order lint (arel, activemodel), the test-name ratchet, the inlined-from
citation spans, fixtures and models comparison (7 model files changed), and
Schema Parity and Query Parity, whose Rails side installs `activerecord` at
the version `build-gemfile.ts` derives from `sources.ts` (`schema.rb` itself
is +13/-0).

So the procedure as written produces a `main` that stays red for as long as
the burn-down takes, with every parallel agent's PR red behind it. Three rules
make the obvious escapes unavailable: PRs branch from `main` and are never
stacked, PRs are small, and no baseline widens.

### Why the new rows cannot simply be fixed in the flip PR

All 39 new call and call-argument rows were attributed to their matched pair
(22 call rows, 10 argument-shape rows and 7 naming rows):

| New rows on a pair whose…                   | Calls | Arguments |
| ------------------------------------------- | ----- | --------- |
| pin DRIFTED                                 | 20    | 17        |
| body changed but the pair is unpinned       | 2     | 0         |
| pair is newly matched by an upstream rename | 0     | 0         |
| Ruby body did not change                    | 0     | 0         |

Every new row is the same fact as a changed Ruby body. Fixing them is the
burn-down. The table also shows what the pin floor is worth: with every
matched pair pinned, a new row cannot appear on a pair the DRIFT list does not
already name. The same held for `v8.1.4`, where all 183 new rows sat on
changed bodies.

## Design

### 1. Target and scope

**Decision (owner, 2026-10-13): `rails` moves from `v8.0.2` to `v8.0.5.1`.
The 8.1 upgrade is a separate RFC that follows this one.**

`v8.0.5.1` was resolved with `git ls-remote --tags
https://github.com/rails/rails 'v8.0*'`; it is the highest 8.0 tag. It takes
in three patch releases (`8.0.3`, `8.0.4`, `8.0.5`) and three security
releases (`8.0.2.1`, `8.0.4.1`, `8.0.5.1`).

Why this target first:

- **It is a fifth of the size.** 169 method bodies change, against 917 to
  `v8.1.4`. The ledger, the dry run and the flip PR get their first real use
  on about 170 units, not about 930, with seven gates the dry run could not
  exercise.
- **Most of it is 8.1 work anyway.** 132 of the 169 changed bodies are
  byte-identical in `v8.1.4`, and 45 of the 46 added defs exist there. Of the
  other 37 bodies, 36 change again in 8.1.4 and one reverts. So about 78% of
  this burn-down comes straight off the 8.1 one.
- **It carries the security fixes** trails is currently three releases behind.

| Package            | Bodies changed in 8.0.5.1 | Of those, identical in 8.1.4 |
| ------------------ | ------------------------- | ---------------------------- |
| activerecord       | 65                        | 51                           |
| activesupport      | 39                        | 32                           |
| actionview         | 18                        | 13                           |
| arel               | 14                        | 12                           |
| actiondispatch     | 14                        | 13                           |
| trailties          | 11                        | 6                            |
| actioncontroller   | 3                         | 2                            |
| activejob          | 3                         | 2                            |
| activemodel        | 1                         | 0                            |
| abstractcontroller | 1                         | 1                            |
| **Total**          | **169**                   | **132**                      |

Options not taken:

- **Go straight to `v8.1.4`.** One flip instead of two, and 8.1 sooner. The
  first use of the machinery would be on the large bump.
- **Wait for 8.2.** No tag exists. Each release skipped makes the next diff
  larger.

**Dependent sources.** Rails' gemspec constraints are unchanged between the
two tags apart from railties gaining `tsort >= 0.2`. What moved is what
`Gemfile.lock` resolves, compared here with `vendor/sources.lock.json`:

| Source            | Pinned  | 8.0.2 lock | 8.0.5.1 lock | 8.1.4 lock | Compare enrolled | Moves?  |
| ----------------- | ------- | ---------- | ------------ | ---------- | ---------------- | ------- |
| rack              | 3.1.14  | 3.1.12     | 3.2.1        | 3.2.6      | api + tests      | **yes** |
| rack-session      | 2.1.0   | 2.1.0      | 2.1.1        | 2.1.2      | api + tests      | **yes** |
| thor              | 1.3.2   | 1.3.2      | 1.4.0        | 1.5.0      | api + tests      | **yes** |
| sqlite3           | 2.6.0   | 2.6.0      | 2.7.3        | 2.9.4      | api              | **yes** |
| pg                | 1.5.9   | 1.5.9      | 1.6.2        | 1.6.3      | api              | **yes** |
| minitest          | 5.27.0  | 5.25.4     | 6.0.0        | 6.0.6      | off (anchor)     | anchor  |
| rails-dom-testing | 2.2.0   | 2.2.0      | 2.3.0        | 2.3.0      | off (anchor)     | anchor  |
| bcrypt-ruby       | 3.1.20  | 3.1.20     | 3.1.20       | 3.1.22     | api + tests      | no      |
| date              | 3.4.1   | 3.4.1      | 3.4.1        | 3.5.1      | tests only       | no      |
| rack-test         | 2.2.0   | 2.2.0      | 2.2.0        | 2.2.0      | tests            | no      |
| i18n              | 1.14.8  | 1.14.7     | 1.14.7       | 1.14.8     | api + tests      | no      |
| globalid          | 1.3.0   | 1.2.1      | 1.2.1        | 1.3.0      | api + tests      | no      |
| msgpack           | 1.8.0   | 1.8.0      | 1.8.0        | 1.8.0      | api + tests      | no      |
| mysql2            | 0.5.6   | 0.5.6      | 0.5.6        | 0.5.6      | api              | no      |
| did_you_mean      | 1.6.3   | not locked | not locked   | not locked | api + tests      | no      |
| ruby              | v3_3_11 |            |              |            | off (anchor)     | no      |

Two pins already lead the 8.0.5.1 lock (i18n and globalid), so "pin equals
Rails' lock" was never an invariant. The rule this RFC sets: **a dependent
source moves to the version the target Rails `Gemfile.lock` resolves, unless
its pin is already at or past it.**

**Order: Rails first and alone, then each gem as its own bump.** Rails'
gemspecs accept every currently pinned gem version, so no gem has to move
before Rails. The reverse is less safe: Rails 8.0.2's own suite ran against
rack 3.1.12, so bumping rack first would put actionpack bodies verified
against 8.0.2 on a rack Rails never ran them against. The five gem diffs have
not been sized at these tags (the 2026-10-13 gem measurements were against the
8.1.4 lock's versions). `size-and-sequence-the-dependent-source-bumps` runs
their dry runs after the Rails flip and files one story each. It also puts one
question to the owner: whether a gem stops at the 8.0.5.1 lock's version, or
waits and moves once with the 8.1 upgrade. A gem bump may overlap the Rails
burn-down, since the ledger is keyed per source.

### 2. The size of the upgrade

All numbers are `v8.0.2` → `v8.0.5.1`, measured 2026-10-13 from a candidate
fetched beside the active version (`pnpm vendor:fetch --source rails --ref
v8.0.5.1`, step 1 of the procedure). No lockfile or gate was touched.

**Ruby source and body pins**, under the `libPath` each package ports (`git
diff --no-index -M --numstat`; pins from `lint-body-pins.ts` and method parity
from `compare.ts`, both run on the v8.0.5.1 manifest):

| Package                   | Files changed | +lines   | -lines  | Pins DRIFT | Pins STALE | Ruby files with either | Unpinned pairs that change | Methods before | Methods after |
| ------------------------- | ------------- | -------- | ------- | ---------- | ---------- | ---------------------- | -------------------------- | -------------- | ------------- |
| arel                      | 9             | 31       | 9       | 20         | 0          | 11                     | 0                          | 1052/1052      | 1052/1058     |
| activemodel               | 5             | 19       | 17      | 1          | 0          | 1                      | 0                          | 821/821        | 821/821       |
| activerecord              | 56            | 464      | 272     | 66         | 0          | 35                     | 5                          | 6980/6980      | 6982/6993     |
| activerecord-test-support | 1             | 1        | 1       | 0          | 0          | 0                      | 0                          | 43/58          | 43/58         |
| activesupport             | 40            | 284      | 195     | 26         | 11         | 12                     | 3                          | 2039/2187      | 2027/2179     |
| actiondispatch            | 14            | 112      | 48      | 13         | 1          | 9                      | 0                          | 1723/1801      | 1722/1802     |
| actioncontroller          | 5             | 50       | 11      | 5          | 0          | 5                      | 2                          | 801/803        | 801/808       |
| abstractcontroller        | 3             | 3        | 14      | 0          | 0          | 0                      | 0                          | 132/132        | 132/132       |
| actionview                | 23            | 92       | 51      | 6          | 0          | 6                      | 6                          | 1215/1482      | 1215/1486     |
| activejob                 | 5             | 17       | 12      | 0          | 0          | 0                      | 0                          | 5/369          | 5/370         |
| trailties                 | 27            | 146      | 78      | 4          | 0          | 3                      | 0                          | 789/1660       | 790/1668      |
| **Total**                 | **189**       | **1221** | **710** | **141**    | **12**     | **82**                 | **16**                     |                |               |

The totals include `actionpackversion`'s one changed file. Two files are
added upstream (one each in activesupport and trailties) and none removed. At the level of every `def`, private ones included: 169 bodies
change, 46 defs are added, 22 are removed and 12 signatures change;
`parity:api:drift` reports +3 classes and no visibility flips. The data layer
goes from 8853/8853 methods to 8855/8872, and the overall figure from
17467/19511 (89.5%) to 17457/19541 (89.3%). A pin drifts where the digest of
the first same-named body on the class's ancestor chain changes, which is why
20 arel pins drift on 14 changed bodies.

**Tests** (`extract-ruby-tests.rb` over each `testPath`; 105 test files
change, +2108/-151 lines):

| Package          | Tests 8.0.2 | Tests 8.0.5.1 | Added   | Removed | Changed in place | Matched before | Matched after |
| ---------------- | ----------- | ------------- | ------- | ------- | ---------------- | -------------- | ------------- |
| arel             | 730         | 730           | 0       | 0       | 0                | 739/739        | 739/739       |
| activemodel      | 1041        | 1043          | 2       | 0       | 0                | 1037/1037      | 1037/1039     |
| activerecord     | 9035        | 9077          | 43      | 1       | 10               | 8801/8830      | 8800/8872     |
| activesupport    | 3496        | 3519          | 26      | 3       | 9                | 2995/3325      | 2994/3345     |
| actiondispatch   | 1689        | 1693          | 4       | 0       | 1                | 1163/1689      | 1163/1693     |
| actioncontroller | 1942        | 1945          | 3       | 0       | 9                | 1651/1945      | 1651/1948     |
| actionview       | 2507        | 2521          | 14      | 0       | 1                | 728/2507       | 728/2521      |
| activejob        | 416         | 421           | 5       | 0       | 1                | 0/396          | 0/401         |
| trailties        | 2419        | 2433          | 15      | 1       | 5                | 223/2419       | 223/2433      |
| **Total**        | **23275**   | **23382**     | **112** | **5**   | **36**           |                |               |

"Changed in place" is a test at the same path whose extracted assertions or
gate differ. No test moves to a new describe path. The extractor counts and
the comparer's denominators differ slightly (gated and generated tests), so
read the two pairs of columns separately. Overall matched tests go from
19579/26347 (74.3%) to 19577/26451 (74.0%).

**What this means for the plan.** The burn-down is on the order of 82 files
to re-verify, 46 defs and 112 tests to port, and 22 defs and 5 tests to
remove: roughly a hundred PRs at the house size. activerecord is 47% of the
drifted pins. The version-string surface is small: 103 versioned citations in
47 files, the `gem-version.ts` constants in six packages, `ActionDispatch`'s
`VERSION`, and the generated schema-parity `Gemfile`.

#### How the size was measured

`parity:api:drift` already extracts a candidate's Ruby API to
`output/rails-api@<ref>.json` without touching `sources.ts`. For the dry run,
the Rails packages of that manifest were merged over a copy of
`output/rails-api.json`, and each `rails-comparison` step from ci.yml was run
against it in order. The test side used `extract-ruby-tests.rb` with
`TEST_PATHS_JSON` rewritten to the candidate directory. Both artifacts are
gitignored and were restored afterwards. This is the procedure
`bump-dry-run-runs-the-gates-against-a-candidate-ref` turns into a command.

Two things the existing drift report does not give: its `ported` flag
undercounts badly (for `v8.1.4` it marked 41 of activerecord's 307 changed
methods as ported where 388 pins drift), and there is no test-side report.

### 3. The transition on `main`

**Decision (recommended; Open question 1): one flip PR, then a burn-down on
`main`, with a bump ledger.**

#### The bump ledger

One committed file per bump, `scripts/parity/bump-ledger/<source>.json`. A row
names one ported unit whose upstream definition changed between the old ref and
the new one:

- a matched method pair, keyed as a body pin is (`package`, `rubyFile`,
  `rubyName`), with `kind: "drift"` (the body changed) or `kind: "removed"` (the
  pin is STALE: the method is gone or renamed upstream);
- a matched test, keyed as test-compare keys it (`package`, Ruby file, test
  path), with `kind: "changed"` (its extracted assertions or gate differ
  between the refs) or `kind: "moved"` (the same description sits under a new
  describe path). Sized in "The test half" below.

Each row carries `from` and `to` refs and, once the burn-down RFC exists, the
story id that owns it. The rules:

1. **Seeded once, mechanically, by the flip PR.** The seed is the dry run's
   output for the two refs: the DRIFT and STALE lists and the changed-test
   list. It is derived from the two Ruby manifests, never from what a gate
   happens to flag. CI recomputes it on the PR that changes the `ref`.
2. **Only-shrink.** A row may be added only by a commit that also changes that
   source's `ref` in `sources.lock.json`. Any other growth is red.
3. **A row scopes the per-unit ratchets off its unit, and nothing else.**
   While a pair is in the ledger, the body-pins gate reports it as a ledger row
   in place of DRIFT or STALE, and the call, call-argument, ruby-compat-call,
   parameter-name, block-parameter, arm and extra-surface ratchets do not count
   rows on that pair. While a test is in the ledger, the assertion ratchet and
   the gate-mismatch check do not count it. No baseline file, mark or exclude
   shard is edited to do this.
4. **A row leaves when its unit is re-verified.** The PR that re-reads the
   port against the new body re-pins the file with `body-pins.ts --pin` and
   deletes the row. From that commit every ratchet applies to the unit at full
   strength, so a new call row there has to be fixed, not baselined. A row
   whose pin already matches the active digest is stale, and stale is red.
5. **A straddling PR is refused.** A PR whose merge base predates the flip and
   which edits `body-pins.json` fails until it is rebased, so a body verified
   against 8.0.2 cannot be pinned at the 8.0.5.1 digest by accident.
6. **Empty means deleted.** The RFC closes when the file has no rows and is
   removed. No trails release is tagged while a ledger has rows (§ 5).

The ledger is a new deviation register, and CLAUDE.md § "A documented deviation
is debt, not permission" applies to it in full: a row is "not yet re-verified",
never "accepted". What makes it different from a baseline row is that nobody
authors one. Its contents are a function of two upstream tags.

It needs the pin floor to be complete. 16 unpinned matched pairs change in
this bump and 2 of the 39 new gate rows sit on them; with no pin there is no
DRIFT row to seed from. Hence the entry criterion in § 4.

**How many rows.** 141 DRIFT and 12 STALE are measured against today's pins.
Both become ledger rows: DRIFT as `kind: "drift"`, STALE as `kind: "removed"`.
Retaking the floor first pins the 16 changing pairs, which then drift too. So
the pair seed at the flip is **about 169 rows** (153 + 16, plus any unpinned
pair that upstream removed, which today's measurement cannot see). The dry run
after the floor is retaken gives the exact figure, and that figure is what
§ Verification checks.

#### The test half

Tests have no pins, so the test seed is computed from the two
`rails-tests.json` manifests directly. 36 tests change in place (the table in
§ 2): activerecord 10, activesupport 9, actioncontroller 9, trailties 5, and
one each in actiondispatch, actionview and activejob. Only a matched test gets
a row, so 36 is a ceiling for `changed` rows; weighting each package by its
matched share puts the seed near 27. No test moves, so there are no `moved`
rows in this bump; the kind exists because `v8.1.4` moves 187 arel tests. The
exact matched subset needs the comparer's per-test output and is an acceptance
criterion of `bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests`.

The 5 tests removed upstream and the 112 added get no row. A removed test's
port becomes a TS-only extra, and a new test is a missing one; neither is
counted by a ratchet the dry run saw go red. Whether the test-name ratchet
counts either is part of Open question 3.

#### Every gate, and what makes it green at the flip commit

| Gate                                  | Disposition                 | Owned by                                                                  |
| ------------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| Body-pins gate                        | ledger                      | `bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it`        |
| Call-mismatches ratchet               | ledger                      | `bump-ledger-scopes-the-call-ratchets-off-drifted-pairs`                  |
| Ratchet baseline reseed drift         | ledger                      | same                                                                      |
| Call-argument ratchet (shape, naming) | ledger                      | same                                                                      |
| Receipt audit gate                    | ledger (green on this bump) | same                                                                      |
| Ruby-compat call ratchet              | ledger (green on this bump) | same                                                                      |
| Missing-throw arm ratchet             | ledger                      | `bump-ledger-scopes-the-signature-and-surface-ratchets-off-drifted-pairs` |
| Extra-surface ratchet                 | ledger (green on this bump) | same                                                                      |
| Parameter-name ratchet                | ledger                      | same                                                                      |
| Block-parameter ratchet               | ledger                      | same                                                                      |
| Test comparison (gate-mismatch)       | ledger (test rows)          | `bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests`            |
| Assertion-mismatch ratchet            | ledger (test rows)          | same                                                                      |
| Vendor citations                      | mechanical flip commit      | `flip-the-rails-ref-to-v8-0-5-1` (`vendor:recite`)                        |
| Inlined-from citation spans           | mechanical flip commit      | same (`parity:api:inlined:fix`)                                           |
| Rails-private JSDoc lint and artifact | mechanical flip commit      | same (regenerated manifest, the rule's autofix)                           |
| Method-order lint (arel, activemodel) | mechanical flip commit      | same (regenerated manifest, `pnpm lint --fix`)                            |
| Test-name ratchet                     | residual: untested          | `bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests`            |
| Fixtures and models comparison        | residual: not exercised     | `bump-dry-run-runs-the-gates-against-a-candidate-ref`                     |
| Schema Parity, Query Parity           | residual: not exercised     | same                                                                      |

The three gates marked "green on this bump" go red on `v8.1.4`, so they are
scoped now and not discovered then. A stale row or receipt on a ledgered pair
is not reported while the pair is ledgered and is deleted by the burn-down
story that re-verifies the pair. One on a pair outside the ledger is deleted
by hand in the flip PR. The four "mechanical" rows that the dry run did not
exercise are expected to be mechanical because each has a generator or an
autofix; the dry-run story confirms that or moves the row to residual.
"`main` is green from the flip commit" holds when no residual row is left,
which is what Open question 3 tracks.

#### What the flip PR contains

One PR, mechanical throughout, in separate commits:

1. `ref: "v8.0.5.1"` in `vendor/sources.ts` and the re-locked
   `vendor/sources.lock.json`.
2. The dry-run report and the seeded ledger.
3. `pnpm vendor:recite` (103 citations, 47 files), as its own commit.
4. Deletions the bump makes stale on pairs outside the ledger, by hand, with
   the marks tightened and no reseed.
5. Regenerated artifacts: the rails-private, deprecation, method-order and
   test-name manifests, the conventions doc and the schema-parity `Gemfile`.
6. Version constants Rails states as literals: `gem_version.rb`'s `MAJOR`,
   `MINOR`, `TINY`, `PRE` in each package's `gem-version.ts`, and
   `ActionDispatch`'s `VERSION`.
7. The regenerated `mirrors` fields (§ 6), if that check has landed.

Anything a gate still reports after that, on a unit outside the ledger, is
fixed in the flip PR. The dry run exists to make that set known, and small,
before the PR is opened. The gates the dry run could not exercise are the
risk; if one cannot be made green mechanically, the flip PR stops and the gap
becomes a tooling story, not an exception.

#### Options compared

- **One flip PR, burn-down on `main`, with the ledger (recommended).** `main`
  is green from the flip commit. Every other gate keeps full strength on every
  unit upstream did not change, which is over 98% of the pins. Burn-down PRs
  branch from `main`, are file-sized, and are independent of each other. Cost:
  a tooling change to roughly a dozen lint scripts, and a `main` that is a mix
  of 8.0.2-verified and 8.0.5.1-verified bodies until the ledger is empty.
- **One flip PR, burn-down on `main`, no gate change.** What the procedure
  says today. `main` is red on ten gates for the whole burn-down, so every
  unrelated PR is red too and a new regression is indistinguishable from the
  backlog. Rejected.
- **One flip PR that also clears the gates.** Either the PR carries the
  re-verification (82 files, against "PRs are small"), or it re-pins and
  reseeds to go green (against "never re-pin to silence the gate" and
  "baselines never widen"). Rejected. At this size it is closer to possible
  than for 8.1, and it would leave 8.1 with no tested answer.
- **A long-lived upgrade branch, merged when green.** Burn-down PRs would
  target the branch, which the no-stacking rule forbids as written, and CI
  triggers on `main` only. `main` lands many PRs a day, each verified against
  8.0.2 and each touching the same baseline shards and `body-pins.json` the
  branch rewrites, so the branch pays a growing merge and re-verification tax
  and ends in one unreviewable merge. Rejected.
- **Pre-port against the candidate tree before the flip.** The gates measure
  8.0.2 until the flip. A body changed to match 8.0.5.1 gains call and
  argument rows against 8.0.2, and a method that exists only in the new tree
  is unreceipted extra surface in packages pinned at `novel === 0`. Only the
  tooling, the dry run and the story generation can be done ahead. Rejected
  for porting; adopted for sizing.
- **Flip one package at a time.** A `ref` per package would cut the blast
  radius, but two active Rails versions at once doubles the citation and
  registry rules RFC 0159 just simplified. Rejected.

#### Parallel work during the burn-down

- An agent on an unrelated story sees a green `main` and unchanged gates.
- An agent touching a ledgered method reads `vendor/rails/v8.0.5.1/`, the
  only active tree. `v8.0.2` stays fetchable beside it
  (`pnpm vendor:fetch --source rails --ref v8.0.2`) for reading what changed,
  and is pruned last.
- Open stories whose bodies cite 8.0.2 line numbers go stale at the flip. The
  fewer are open, the less is re-derived, which is the argument for the entry
  criteria below.
- Burn-down order follows the dependency order arel, activemodel,
  activesupport, activerecord, actionpack, actionview, trailties, so a
  re-verified caller does not sit on an unverified callee for long. The
  ledger does not enforce it; story `deps` in the burn-down RFC do.

### 4. Entry criteria

**Must be true on 8.0.2 before the flip:**

1. **The dry-run command and the ledger have merged**, and a dry run on
   current `main` reports no red gate on a unit outside the ledger.
2. **Zero unpinned matched bodies in every package under the `rails`
   source** (898 today). RFC 0159's `pin-the-body-hash-floor-before-the-first-bump`
   took the whole-surface floor on 2026-09-25 (trails#8100); the 898 are pairs
   matched since then by ports that did not pin their file.
   `pnpm parity:api:pins:all` retakes the floor in one PR immediately before
   the flip. A floor pin claims only "this is the tree the port was written
   against", which is true of every one of them.
3. **Every gate is green on `main` at the commit the flip merges onto.** The
   flip PR is rebased onto a `main` commit whose CI run is green and merges
   with nothing landing in between; trails merges by squash only, so that
   commit is the flip commit's single parent and gets the tag.
4. **The data layer is closed out: arel, activemodel and activerecord at 100%
   on `parity:api` and `parity:test`, and RFC 0175 closed.** Ruled by the
   owner on 2026-10-13: RFC 0175 finishes first, and is being burned down
   now. Methods are there today; activerecord tests are 8801/8830. The reason
   is the tag: `rails-8.0.2` marks a complete data layer on the tree it was
   ported against. For scale, RFC 0175 has 45 of 130 stories open (13,900
   est-loc) and closed 82 in the 14 days since 2026-09-30; the five ledger
   and dry-run stories of this RFC (about 2,350 est-loc) have to merge first
   in any case.

**Need not be true:**

- actionpack, actionview, activejob or trailties parity. The flip moves their
  denominators and their ledger rows; it does not need them finished.
- Pins on the non-Rails gems (thor has 367 unpinned). Each gem's own bump
  retakes its own floor.
- RFC 0100, any published package, or a version-scheme ruling (§ 6).
- An empty `call-mismatches-exclude/` or zero receipts. Existing debt on
  units upstream did not change is unaffected by the bump.

### 5. Branching and tagging

Recommended; branch policy is the owner's (Open question 2).

- **Every Rails flip tags its parent `rails-<old>`.** This flip's parent gets
  an annotated tag `rails-8.0.2`: the complete data layer on the tree it was
  ported against. It is placed once the flip has merged, with the parity
  summary in its message. trails allows squash merges only, so the flip
  commit has exactly one parent. Tagging after the merge removes the race in
  which another PR lands between a pre-placed tag and the flip. If that
  parent's own `main` CI run was red, it is tagged anyway and the message
  records the run and the failing job: the name means "the last commit whose
  source of truth was this Rails version", and the flip PR's green CI on that
  same tree is the evidence that the red was not in what the tag describes.
  Release tags, once there are releases, are `v<trails-version>`, so the two
  namespaces never collide.
- **No stable branch until a backport needs one.** Nothing is published, so
  nothing can need a fix on an older line. A tag costs nothing and a branch
  can be cut from it at any later time.
- **After publishing, the same rule holds.** Cut `<major>-<minor>-stable`
  (Rails' own spelling) from the `rails-<old>` tag only when a published
  release line exists for it and a fix has to ship there. At that moment
  ci.yml's `branches: [main]` gains the branch. A fix lands on `main` first
  and is cherry-picked back.
- **No release tag while a ledger has rows.** A release is cut from a commit
  where every ported body is verified against one Rails version.
- **A patch and a minor bump are the same procedure.** This RFC is the patch
  case. Run the dry run; if the seed and the fixes fit one PR, the bump is one
  story with no ledger file; if not, as here, it seeds a ledger and burns
  down. Patches are taken promptly once anything is published: a security
  release is the one upstream change a published trails cannot sit behind.

### 6. Version numbers and the first release

**Deferred to the 8.1 upgrade RFC**, which
`write-the-retrospective-and-scope-the-rails-8-1-upgrade` opens. Nothing is
published and this bump changes no package version, so neither question has to
be answered to flip to `v8.0.5.1`. The analysis is recorded here so it is not
redone.

Three schemes were asked for:

- **(a) trails keeps its own semver; 1.0 is a milestone independent of
  Rails.** Honest semver, and `0.x` says "not finished" about a stack where
  trailties passes 9% of Rails' tests. Cost: the version says nothing about
  which Rails is mirrored, so every user needs a mapping table.
- **(b) trails matches Rails' `major.minor`, with its own patch counter.**
- **(c) trails matches Rails' full version.** A trails-only fix has no number:
  `8.0.5.2` is not semver and would collide with a real Rails release,
  `8.0.5-1` sorts before `8.0.5`, and npm ignores `8.0.5+1`. This bump shows
  a second problem: `8.0.5.1` itself has four segments and is not a valid npm
  version. Rejected.

**Recommendation carried forward: (b).**

- **`major.minor` is the mirrored Rails minor. `patch` is trails' counter.**
  It rises for a trails-only fix, a newly ported method or test, and a Rails
  patch bump. It is not Rails' `TINY`.
- **Maturity is carried by prerelease tags, not by `0.x`**
  (`8.1.0-alpha.N`). npm does not resolve a prerelease from a caret or tilde
  range.
- **A breaking TS-only change** lands at a Rails minor boundary, or in a patch
  with a changelog entry that leads with it.
- **npm consumers.** `^8.1.0` admits `8.2.0`, and a Rails minor carries
  behaviour changes. Document `~8.1.0`, and publish inter-package dependencies
  as exact versions.
- **Which packages version together.** _A package that mirrors an upstream
  gem takes that gem's `major.minor`; a package with no upstream owns its
  semver._ The Rails-source packages are one fixed group. A gem port follows
  its gem. ruby-compat, trails-tsc, tse-compiler and activerecord-cli stay on
  plain semver.
- **RFC 0100** must land before the first stable release, since under (b) no
  major is available to announce a change to the tarball's shape afterwards.

**The first public release: recommended to wait for 8.1.** A release
mirroring 8.0 would open an 8.0 line needing a stable branch the day `main`
flips to 8.1, and under (b) it would spend the `8.0` minor on a line abandoned
soon after.

**What this RFC does do for versioning: the mirrored ref is recorded.** In
each `package.json`, a generated `mirrors` field: `{ "source": "rails",
"ref": "v8.0.5.1", "sha": "beef74d4cebf…" }`, written from
`sources.lock.json` and checked in CI so it cannot drift from the registry. It
is regenerated in the flip PR, so the check is never off. `mirrors.ref` means
"the ref the gates measure this package against". It does not claim every
body is verified against that ref; the absence of a ledger file for the source
does. At run time the ported `gem_version.rb` constants already answer Rails'
own version. Story: `record-the-mirrored-ref-in-each-package`.

### 7. The repeatable version

8.1 comes next, then 8.2. What this RFC leaves behind:

1. `pnpm parity:bump:dry-run --source <name> --ref <tag>`: both manifests for
   the candidate, every gate run against them, a per-gate report, the size
   tables of § 2, and the ledger seed. It supersedes hand-running
   `parity:api:drift` for scoping and adds the test side.
2. The ledger and its gates, which are per source and reusable unchanged.
3. A runbook in `vendor/README.md` (below) that a person or an agent can run
   end to end.
4. A story generator: from a seeded ledger and the comparer's missing lists,
   one story per Ruby file, written into a new burn-down RFC.
5. A history of every bump in the stats DB.
6. A retrospective, and an 8.1 RFC scoped from it.

#### History in the stats DB

The owner asked on 2026-10-13 that this process be kept in the stats DB for
later reference. The DB (`~/github/blazetrailsdev/stats.db`, filled by
`pnpm stats:sync`) already records `parity:api` and `parity:test` figures per
merge commit, so the parity curve across a flip is there today. What is
missing is the bump itself. `bump-history-is-recorded-in-the-stats-db` adds:

| Table                                                | One row per                       | Answers                                               |
| ---------------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| `vendor_bumps`                                       | source and ref pair               | when it flipped, which PR, which tag, when it closed  |
| `vendor_bump_reports`, `vendor_bump_report_packages` | dry-run report, and package in it | what was predicted, and how the prediction moved      |
| `vendor_bump_gate_results`                           | report and gate                   | which gates were predicted red, with counts           |
| `bump_ledger_stats`                                  | merge commit, package and kind    | the burn-down curve: rows remaining after every merge |

Nothing writes to the DB but the sync. The dry-run report is a JSON file
committed by the flip PR, and the ledger gate prints a summary line in the
`rails-comparison` log that the sync parses as it parses the compare
summaries, so a rebuilt DB recovers the whole history from the repo and CI.
Both of today's measurements (`v8.0.5.1` in § 2, `v8.1.4` in § 8) are
backfilled as the first reports, marked as transcribed by hand. The
retrospective reads its figures back out of these tables, which is their
first use.

#### The runbook

As it will be written into vendor/README.md § "Upgrading a source":

1. Resolve the target tag from the upstream remote. Read its `Gemfile.lock`
   against `sources.lock.json` and apply the dependent-source rule of § 1.
2. Fetch the candidate beside the active version. Run the dry run. Put its
   tables in the upgrade RFC and commit its report.
3. Check the entry criteria. Retake the pin floor for the source's packages.
4. Open the flip PR: `ref`, lockfile, report, seeded ledger, recite, stale
   deletions, regenerated artifacts, version constants, `mirrors` fields.
5. Once it merges, tag its parent commit `rails-<old>`.
6. Generate the burn-down stories and write their ids into the ledger rows.
7. Burn down: re-verify, re-pin, delete the row. Port what is new. Delete what
   is gone.
8. When the ledger is empty: delete it, re-read the rewritten citations,
   `pnpm vendor:fetch --prune`, write the retrospective, close the RFC.
9. Bump the dependent sources by the same steps, smallest first.

Documents that change, in `document-the-minor-bump-runbook`:

- **vendor/README.md.** § "Scoping a Rails bump" points at the dry run.
  § "Upgrading a source", written by RFC 0159's
  `document-the-upstream-upgrade-procedure`, gains the entry criteria, the
  tag, the ledger and the flip PR's contents, and step 6 stops implying the
  DRIFT list is burnt down with the gate red. § "What the parity gates do
  across a bump" gains the gate table and the ledger rules. The stale
  `## Status` wave table is dropped.
- **CONTRIBUTING.md § "Body pins".** "When the gate fails: DRIFT" describes a
  ledger row during a bump, and `--pin` deletes the row it clears.
- **CLAUDE.md.** The register list in § "A documented deviation is debt, not
  permission" names the bump ledger; "Before you open the PR" gains one line
  on touching a ledgered unit. Its `vendor/rails/v8.0.2/` citations move with
  `vendor:recite`.

### 8. The next bump: v8.1.4

Not planned here. Recorded so the 8.1 RFC starts from numbers, and so the
tooling is built for the larger case. The right-hand column is `v8.0.2` →
`v8.1.4` (`c3466ea00d7121798e3aa3144ffdf7174b81d8cb`, tagged 2026-09-24, the
highest `v8.1*` tag; no `v8.2*` tag exists), measured 2026-10-13. It is
superseded by a dry run from the `v8.0.5.1` base when this RFC closes.

| Measure                                | v8.0.5.1         | v8.1.4               |
| -------------------------------------- | ---------------- | -------------------- |
| Ruby files changed under ported paths  | 189 (+1221/-710) | 635 (+12,906/-4,728) |
| Files added / removed                  | 2 / 0            | 40 / 11              |
| Defs added / removed                   | 46 / 22          | 839 / 227            |
| Bodies changed / signatures changed    | 169 / 12         | 917 / 121            |
| Pins DRIFT / STALE                     | 141 / 12         | 728 / 125            |
| Ruby files with either                 | 82               | 288                  |
| Unpinned matched pairs that change     | 16               | 77                   |
| New call rows / argument rows          | 22 / 17          | 107 / 76             |
| Tests added / removed / moved          | 112 / 5 / 0      | 1,239 / 115 / 187    |
| Tests changed in place                 | 36               | 236                  |
| Gates red at the flip without a ledger | 10               | 13                   |
| Data-layer methods after the flip      | 8855/8872        | 8780/9059            |

Per package, the 8.1.4 pins are: activerecord 388 DRIFT and 65 STALE in 127
files, activesupport 104 and 28 in 47, actiondispatch 95 and 18 in 35, arel
42 and 3 in 20, trailties 30 and 8 in 17, actioncontroller 29 and 1 in 14,
actionview 17 in 13, activemodel 19 and 2 in 11, activerecord-test-support 4.
The three gates that are green here and red there are the receipt audit (5
receipts), the ruby-compat call ratchet (2 rows) and the extra-surface ratchet
(activerecord novel 0 → 22, total 0 → 71; arel total 0 → 2). Rails 8.1 also
adds `json` to activesupport's dependencies, drops `benchmark`, and adds
`action_text-trix` to actiontext.

## Non-goals

- **Porting any Rails code.** The burn-down is a separate RFC generated by
  `generate-the-rails-8-0-5-1-burn-down-stories`.
- **The 8.1 upgrade.** A follow-up RFC, opened by
  `write-the-retrospective-and-scope-the-rails-8-1-upgrade`.
- **Publishing, and package version numbers.** § 6 records the analysis and
  defers the decision.
- **Migration version compatibility.** Out of scope for trails.
- **Changing what any ratchet measures.** The ledger changes which units a
  ratchet counts during a bump, and nothing about how a unit is scored.
- **Trilogy.** Never ported.

## Alternatives considered

The transition strategies are compared in § 3 and the targets in § 1. Two
more:

- **Make DRIFT advisory during a bump.** A flag that downgrades the body-pins
  gate to a warning greens one gate and leaves the rest red, since the call
  and argument rows are the same changed bodies seen by other gates.
- **Receipt each changed pair at its declaration** (`@missingRailsCall` and
  friends, `CONVERGEABLE <story>`). It reuses machinery that exists, but it
  writes a tag per changed pair into source, each authored by hand and
  reviewable only by re-deriving the diff, and all deleted again. The ledger
  holds the same information in one generated file.

## Rollout

1. **Tooling, on 8.0.2.** `bump-dry-run-runs-the-gates-against-a-candidate-ref`,
   then `bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it`,
   `bump-ledger-scopes-the-call-ratchets-off-drifted-pairs`,
   `bump-ledger-scopes-the-signature-and-surface-ratchets-off-drifted-pairs`,
   `bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests` and
   `bump-history-is-recorded-in-the-stats-db`.
   `record-the-mirrored-ref-in-each-package` is independent.
2. **Entry.** `entry-check-data-layer-parity-is-closed-on-8-0-2`, then
   `retake-the-body-pin-floor-at-the-last-8-0-2-commit`.
3. **Flip.** `flip-the-rails-ref-to-v8-0-5-1`, then
   `tag-the-last-rails-8-0-2-commit` on its parent.
4. **Post-flip.** `generate-the-rails-8-0-5-1-burn-down-stories`,
   `reread-the-recited-rails-citations-against-v8-0-5-1` and
   `size-and-sequence-the-dependent-source-bumps` in parallel, then
   `document-the-minor-bump-runbook`, which waits for the generator. The
   burn-down itself runs in the generated RFC.
5. **Close.** `retire-the-rails-ledger-and-prune-v8-0-2`, then
   `write-the-retrospective-and-scope-the-rails-8-1-upgrade`.

Story clusters are the phase names: `tooling`, `entry`, `flip`, `post-flip`
and `close`.

## Verification

- Before the flip: the dry run on `main` reports **0** red gates on units
  outside the ledger seed, and **0** unpinned matched bodies in the Rails
  packages (898 today).
- The flip PR's CI is green, and so is the first unrelated PR merged after it.
- At the flip commit the Rails ledger holds exactly the rows the dry run
  computes after the floor is retaken: about 169 pair rows (141 drift, 12
  removed, and the 16 newly pinned pairs that change) and at most 36 test
  rows. It only shrinks from there. `git log -p` on the file shows no added
  row outside a lockfile `ref` change.
- At close: the ledger file is gone, `pnpm parity:api:pins` reports 0 DRIFT
  and 0 STALE with `rails` at `v8.0.5.1`, `git grep 'vendor/rails/v8\.0\.2'`
  is empty, and no call, argument, parameter, block, arm, extra-surface or
  assertion baseline or mark is wider than at the `rails-8.0.2` tag.
- The stats DB answers, for this bump: rows predicted, rows at the flip, and
  days from flip to empty ledger.
- `vendor/README.md` holds a runbook that names every command used, and an
  8.1 upgrade RFC is open with a dry run from the `v8.0.5.1` base.

## Open questions

<!-- Every question here must be resolved or explicitly deferred (to a named
     follow-up RFC/story) before this RFC moves to `status: active`. -->

1. **Is the bump ledger acceptable?** (Owner.) It suspends the per-unit
   ratchets on about 169 pairs and up to 36 tests for the length of the
   burn-down, which is a new register in a repo whose rule is that registers
   only shrink. Recommendation: yes, because its rows are generated from two
   upstream tags and it is the only option that keeps `main` green without
   widening a baseline. Alternative: accept a red `main` on ten gates for the
   burn-down, with a merge freeze on everything but burn-down PRs.
2. **Branch policy.** (Owner.) Recommendation: tags only; a
   `<major>-<minor>-stable` branch is cut lazily from the tag when a published
   line needs a fix. Alternative: cut a stable branch at each flip.
3. **Does the ledger cover gates the dry run could not exercise?** The
   rails-private, method-order and test-name lints and the two real-Rails
   parity jobs may report new debt at the flip that is not keyed by pair or
   test. Deferred to `bump-dry-run-runs-the-gates-against-a-candidate-ref`,
   which must either exercise them or list them as residual risk with a count.

Resolved or deferred:

- **Target.** Resolved 2026-10-13 by the owner: `v8.0.5.1` first, as this
  RFC; 8.1 as a follow-up.
- **Is closing RFC 0175 an entry criterion?** Resolved 2026-10-13 by the
  owner: yes. § 4, criterion 4.
- **Version scheme, and release timing.** Deferred to the 8.1 upgrade RFC
  opened by `write-the-retrospective-and-scope-the-rails-8-1-upgrade`. § 6.
- **Do dependent gems stop at the 8.0.5.1 lock's versions?** Deferred to
  `size-and-sequence-the-dependent-source-bumps`, which asks it with the dry
  runs in hand.

## Changelog

- 2026-10-13: initial RFC, drafted for `v8.1.4`.
- 2026-10-13: review round 1. Ledger seed restated post-floor and the test
  half sized; one disposition per gate; `mirrors` regenerated at the flip; tag
  placement on a squash merge; clusters renamed to the rollout phases;
  RFC 0159's floor and procedure stories cited.
- 2026-10-13: owner rulings. RFC 0175 closes before the flip. Bump history is
  kept in the stats DB.
- 2026-10-13: re-scoped by the owner to `v8.0.5.1` as its own upgrade, and
  renamed from `rails-8-1-upgrade-workflow`. Every figure re-measured against
  `v8.0.5.1`, the gates re-run against its manifests, the 8.1.4 flip and
  version-scheme stories removed, the 8.1.4 measurements moved to § 8, and a
  closing story added that writes the 8.1 RFC.
