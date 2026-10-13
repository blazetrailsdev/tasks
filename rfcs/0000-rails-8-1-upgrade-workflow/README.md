---
rfc: "0000-rails-8-1-upgrade-workflow"
title: "Rails 8.1 upgrade workflow: sequence, gating, tagging and version numbers for moving the source of truth from v8.0.2 to v8.1.4"
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
  - rehearsal
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

# RFC — Rails 8.1 upgrade workflow

## Summary

trails mirrors Rails `v8.0.2`. The latest 8.1 release is **`v8.1.4`**
(`c3466ea00d7121798e3aa3144ffdf7174b81d8cb`, tagged 2026-09-24; no `v8.2*` tag
exists). This RFC plans how the source of truth moves there. It decides
sequence, gating, tagging and version numbers. It ports no Rails 8.1 code and
holds no porting stories: the burn-down is one story here that generates a
separate RFC after the flip.

The mechanical procedure already exists (vendor/README.md § "Upgrading a source
(bumping `ref`)", designed by RFC 0159). What it does not answer is how `main`
stays green between the one-line `ref` bump and the last re-verified body. A
dry run of every gate against the v8.1.4 manifests shows the bump turns **thirteen
CI gates red at once**, on **728 drifted and 125 stale body pins across 288 Ruby
files**, and that no baseline may widen to absorb it.

The recommendation is one flip PR on `main` followed by a burn-down on `main`,
made possible by a **bump ledger**: a committed, only-shrink list of the ported
units whose upstream definition changed, which scopes the per-unit ratchets off
those units until each is re-verified. Three decisions are the repo owner's and
are presented as recommendations: the ledger itself (Open question 1), the
version scheme (2) and the release timing (3). The owner has ruled on two
others: RFC 0175 closes first (5), and the whole procedure is rehearsed on
`v8.0.5.1` before the 8.1 flip (4). Every dry run, flip and ledger count is
kept in the stats DB (§ 7).

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
against the v8.1.4 Ruby manifests (the method is in § "How the size was
measured"). Percentages are not gated; ratchets are.

| Gate (ci.yml step)                                                                                                                                                | Result at the flip commit                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Body-pins gate                                                                                                                                                    | **red**: 728 DRIFT, 125 STALE (`lint-body-pins.ts` exits 1 on either) |
| Call-mismatches ratchet                                                                                                                                           | **red**: 107 new rows, 2 stale rows, 5 stale `@missingRailsCall` tags |
| Ratchet baseline reseed drift                                                                                                                                     | **red**: follows from the 107 new rows                                |
| Call-argument ratchet                                                                                                                                             | **red**: 55 new shape rows, 22 naming failures, 3 stale rows          |
| Receipt audit gate (activerecord)                                                                                                                                 | **red**: 5 receipts suppress no flag                                  |
| Ruby-compat call ratchet                                                                                                                                          | **red**: 2 new rows                                                   |
| Missing-throw arm ratchet                                                                                                                                         | **red**: 2 stale `@inventedArm` receipts                              |
| Extra-surface ratchet                                                                                                                                             | **red**: activerecord novel 0 → 22 and total 0 → 71; arel total 0 → 2 |
| Parameter-name ratchet                                                                                                                                            | **red**: 12 dimensions grow                                           |
| Block-parameter ratchet                                                                                                                                           | **red**: 8 dimensions grow                                            |
| Test comparison (`--gates --check`)                                                                                                                               | **red**: 7 activerecord gate-mismatches against a hard zero           |
| Assertion-mismatch ratchet                                                                                                                                        | **red**: 19 package/dimension marks grow (activerecord count 0 → 33)  |
| Vendor citations (Preflight)                                                                                                                                      | **red** until `pnpm vendor:recite` runs: 103 citations in 47 files    |
| API comparison, privates, arity and inheritance excludes, predicate-kind, inlined-from, ambiguous-parent, dependency lint, missing-call reasons, AR-closure guard | green                                                                 |

Not exercised by the dry run, because each reads the active version directory
or runs real Rails: the rails-private JSDoc lint and its runtime artifact (28
visibility flips upstream), the method-order lint (arel, activemodel), the
test-name ratchet (arel moved 187 tests to new describe paths), the inlined-from
citation spans, fixtures and models comparison (36 model files and 7 fixture
files changed), and Schema Parity and Query Parity, whose Rails side installs
`activerecord` at the version `build-gemfile.ts` derives from `sources.ts`
(`schema.rb` itself is +41/-3). Expect each to move.

So the procedure as written produces a `main` that stays red for as long as
the burn-down takes, with every parallel agent's PR red behind it. Three rules
make the obvious escapes unavailable: PRs branch from `main` and are never
stacked, PRs are small, and no baseline widens.

### Why the new rows cannot simply be fixed in the flip PR

All 183 new call and call-argument rows were attributed to their matched pair
(107 call rows, 55 argument-shape rows and 21 naming rows; the naming gate's
22nd failure is a stale `@missingRailsName` receipt, not a row):

| New rows on a pair whose…                   | Calls | Arguments |
| ------------------------------------------- | ----- | --------- |
| pin DRIFTED                                 | 97    | 71        |
| body changed but the pair is unpinned       | 8     | 5         |
| pair is newly matched by an upstream rename | 2     | 0         |
| Ruby body did not change                    | 0     | 0         |

Every new row is the same fact as a changed Ruby body. Fixing them is the
burn-down, and it is hundreds of PRs. The table also shows what the pin floor
is worth: with every matched pair pinned, a new row cannot appear on a pair the
DRIFT list does not already name.

## Design

### 1. Target and scope

**Decision: `rails` moves from `v8.0.2` to `v8.1.4`, by way of `v8.0.5.1`.**
The owner ruled on 2026-10-13 that the procedure is rehearsed on the last 8.0
release first ("Two flips" below). The 8.1 tag was
resolved with `git ls-remote --tags https://github.com/rails/rails 'v8.1*'`;
`v8.1.4` is the highest, and `v8.1.3.1` / `v8.1.2.1` are the security releases
it includes.

Options considered:

- **Go straight to `v8.1.4`.** One flip instead of two, and 8.1 sooner. Not
  chosen: the first use of the ledger, the dry run and the flip PR would be on
  about 930 pairs, with seven gates never exercised.
- **Wait for 8.2.** No tag exists. Each release we skip makes the next diff
  larger and the burn-down longer.

**Two flips.** `v8.0.5.1` (tagged 2026-07-29) is the last 8.0 release. From
`v8.0.2`:

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

Of the other 37, 36 change again in 8.1.4 and one reverts to its 8.0.2 body.
46 defs are added, 45 of which exist in 8.1.4. So 78% of the rehearsal's re-verification is work the 8.1 bump needs
anyway, and it comes off the 8.1 seed; about 37 bodies are verified twice. The
rehearsal also takes in three security releases. These are def-level counts
from the manifests: no gate has been run against `v8.0.5.1`, and its pin drift
(near 130 by proportion) and test changes come from its own dry run.

The 8.1 flip does not open until the 8.0.5.1 ledger is empty, since two Rails
ledgers at once is what the design avoids. Everything in § 2 and § 3 below is
measured `v8.0.2` → `v8.1.4` and is re-measured from the `v8.0.5.1` base when
the rehearsal closes
(`retire-the-rails-8-0-5-1-ledger-and-review-the-rehearsal`). The rehearsal
bumps no dependent source.

**Dependent sources.** Rails' gemspec constraints did not change between the
two tags (`rack >= 2.2.4`, `thor ~> 1.0, >= 1.2.2`, `i18n >= 1.6, < 2`,
`minitest >= 5.1`, `rack-session >= 1.0.1`, `rack-test >= 0.6.3`,
`globalid >= 0.3.6`, `rails-dom-testing ~> 2.2`). What moved is what
`Gemfile.lock` resolves, compared here with `vendor/sources.lock.json`:

| Source            | Pinned  | 8.0.2 lock | 8.1.4 lock | Compare enrolled | Moves?  | Size of the diff (lib; tests)                      |
| ----------------- | ------- | ---------- | ---------- | ---------------- | ------- | -------------------------------------------------- |
| rack              | 3.1.14  | 3.1.12     | 3.2.6      | api + tests      | **yes** | 23 files +976/-683; 25 files +1365/-237; 457 pins  |
| rack-session      | 2.1.0   | 2.1.0      | 2.1.2      | api + tests      | **yes** | 4 files +357/-126; 4 files +424/-108; 57 pins      |
| thor              | 1.3.2   | 1.3.2      | 1.5.0      | api + tests      | **yes** | 8 files +97/-21; 9 files +395/-9; 0 pins           |
| sqlite3           | 2.6.0   | 2.6.0      | 2.9.4      | api              | **yes** | 3 files +66/-16; 115 pins                          |
| pg                | 1.5.9   | 1.5.9      | 1.6.3      | api              | **yes** | 6 files +322/-139; 0 pins                          |
| bcrypt-ruby       | 3.1.20  | 3.1.20     | 3.1.22     | api + tests      | **yes** | 1 file +10/-1; 1 file +1/-1                        |
| minitest          | 5.27.0  | 5.25.4     | 6.0.6      | off (anchor)     | anchor  | a major; `Gemfile` now says `"~> 6.0"`             |
| rails-dom-testing | 2.2.0   | 2.2.0      | 2.3.0      | off (anchor)     | anchor  | not measured                                       |
| date              | 3.4.1   | 3.4.1      | 3.5.1      | tests only       | anchor  | not measured                                       |
| rack-test         | 2.2.0   | 2.2.0      | 2.2.0      | tests            | no      |                                                    |
| i18n              | 1.14.8  | 1.14.7     | 1.14.8     | api + tests      | no      |                                                    |
| globalid          | 1.3.0   | 1.2.1      | 1.3.0      | api + tests      | no      |                                                    |
| msgpack           | 1.8.0   | 1.8.0      | 1.8.0      | api + tests      | no      |                                                    |
| mysql2            | 0.5.6   | 0.5.6      | 0.5.6      | api              | no      | 8.1's `Gemfile` caps it at `< 0.5.7`               |
| did_you_mean      | 1.6.3   | not locked | not locked | api + tests      | no      | bundled with Ruby                                  |
| ruby              | v3_3_11 |            |            | off (anchor)     | no      | `required_ruby_version` is `>= 3.2.0` at both tags |

Four pins already lead the 8.0.2 lock (rack, i18n, globalid, minitest), so
"pin equals Rails' lock" was never an invariant. The rule this RFC sets:
**a dependent source moves to the version the target Rails `Gemfile.lock`
resolves, unless its pin is already at or past it.**

**Order: Rails first and alone, then each gem as its own bump.** Rails 8.1's
gemspecs accept every currently pinned gem version, so no gem has to move
before Rails. The reverse is less safe: Rails 8.0.2's own suite ran against
rack 3.1.12 and 8.1.4's runs against 3.2.6, so bumping rack first would put
actionpack bodies verified against 8.0.2 on a rack that Rails never ran them
against.
After the Rails flip, smallest first: bcrypt-ruby, sqlite3, pg, thor,
rack-session, rack, then the three read-anchors (date, rails-dom-testing,
minitest), which carry no gate but the citation one. Each is sized by its own
dry run and filed as its own story by
`size-and-sequence-the-dependent-source-bumps`. A gem bump may overlap the
Rails burn-down: the ledger is keyed per source.

Rails 8.1 also changes its own runtime dependencies: activesupport adds `json`
and drops `benchmark`, railties adds `tsort >= 0.2`, and actiontext adds
`action_text-trix`. None is a vendored source. They are noted for the
burn-down RFC and are out of scope here.

### 2. The size of the upgrade

All numbers are `v8.0.2` → `v8.1.4`, measured 2026-10-13 from candidates
fetched beside the active versions (`pnpm vendor:fetch --source rails --ref
v8.1.4`, step 1 of the procedure). No lockfile or gate was touched.

**Ruby source, under the `libPath` each package ports** (`git diff --no-index
-M --numstat`; method counts from the two `rails-api` manifests, every `def`
including private ones):

| Package                   | Files changed | Added  | Removed | +lines    | -lines   | Defs added | Defs removed | Bodies changed | Signatures changed |
| ------------------------- | ------------- | ------ | ------- | --------- | -------- | ---------- | ------------ | -------------- | ------------------ |
| arel                      | 17            | 0      | 0       | 169       | 72       | 12         | 5            | 29             | 6                  |
| activemodel               | 33            | 2      | 0       | 422       | 98       | 34         | 3            | 21             | 5                  |
| activerecord              | 166           | 6      | 2       | 4201      | 1965     | 283        | 117          | 406            | 40                 |
| activerecord-test-support | 6             | 1      | 0       | 137       | 4        | 13         | 0            | 4              | 0                  |
| activesupport             | 118           | 9      | 1       | 2920      | 816      | 163        | 44           | 166            | 22                 |
| actiondispatch            | 63            | 2      | 0       | 1384      | 624      | 53         | 24           | 109            | 33                 |
| actioncontroller          | 24            | 1      | 0       | 483       | 95       | 64         | 1            | 20             | 2                  |
| abstractcontroller        | 7             | 0      | 0       | 32        | 25       | 26         | 0            | 3              | 0                  |
| actionview                | 47            | 1      | 0       | 578       | 219      | 34         | 0            | 52             | 5                  |
| activejob                 | 38            | 8      | 3       | 1280      | 326      | 112        | 11           | 29             | 4                  |
| trailties                 | 116           | 10     | 5       | 1300      | 484      | 45         | 22           | 78             | 4                  |
| **Total**                 | **635**       | **40** | **11**  | **12906** | **4728** | **839**    | **227**      | **917**        | **121**            |

16,102 defs become 16,714. `pnpm parity:api:drift --ref v8.1.4` reports the
same diff as +76/-14 classes, 116 signature changes, 28 visibility flips and
665 call-set changes.

**Body pins and method parity after the flip** (from `lint-body-pins.ts` and
`compare.ts` run on the v8.1.4 manifest):

| Package                   | Pins DRIFT | Pins STALE | Ruby files with either | Unpinned pairs that change | Methods before | Methods after |
| ------------------------- | ---------- | ---------- | ---------------------- | -------------------------- | -------------- | ------------- |
| arel                      | 42         | 3          | 20                     | 0                          | 1052/1052      | 1053/1059     |
| activemodel               | 19         | 2          | 11                     | 0                          | 821/821        | 825/857       |
| activerecord              | 388        | 65         | 127                    | 26                         | 6980/6980      | 6902/7143     |
| activerecord-test-support | 4          | 0          | 4                      | 0                          | 43/58          | 43/71         |
| activesupport             | 104        | 28         | 47                     | 7                          | 2039/2187      | 2010/2317     |
| actiondispatch            | 95         | 18         | 35                     | 3                          | 1723/1801      | 1700/1832     |
| actioncontroller          | 29         | 1          | 14                     | 10                         | 801/803        | 815/894       |
| abstractcontroller        | 0          | 0          | 0                      | 0                          | 132/132        | 132/158       |
| actionview                | 17         | 0          | 13                     | 27                         | 1215/1482      | 1225/1508     |
| activejob                 | 0          | 0          | 0                      | 0                          | 5/369          | 5/506         |
| trailties                 | 30         | 8          | 17                     | 4                          | 789/1660       | 782/1682      |
| **Total**                 | **728**    | **125**    | **288**                | **77**                     |                |               |

The data layer goes from 8853/8853 methods to 8780/9059, and the overall figure
from 17467/19511 (89.5%) to 17359/20193 (86.0%). A pin drifts where the digest
of the first same-named body on the class's ancestor chain changes, which is
why 42 arel pins drift on 29 changed bodies.

**Tests** (`extract-ruby-tests.rb` over each `testPath`; "moved" is the same
description under a different describe path):

| Package          | Tests 8.0.2 | Tests 8.1.4 | Added    | Removed | Moved   | Files added | Matched before | Matched after |
| ---------------- | ----------- | ----------- | -------- | ------- | ------- | ----------- | -------------- | ------------- |
| arel             | 730         | 728         | 1        | 3       | 187     | 0           | 739/739        | 734/737       |
| activemodel      | 1041        | 1064        | 23       | 0       | 0       | 1           | 1037/1037      | 1037/1060     |
| activerecord     | 9035        | 9544        | 553      | 44      | 0       | 4           | 8801/8830      | 8757/9335     |
| activesupport    | 3496        | 3675        | 209      | 30      | 0       | 9           | 2995/3325      | 2970/3502     |
| actiondispatch   | 1689        | 1753        | 81       | 17      | 0       | 1           | 1163/1689      | 1158/1753     |
| actioncontroller | 1942        | 2014        | 76       | 4       | 0       | 3           | 1651/1945      | 1647/2017     |
| actionview       | 2507        | 2592        | 88       | 3       | 0       | 1           | 728/2507       | 728/2592      |
| activejob        | 416         | 488         | 75       | 3       | 0       | 2           | 0/396          | 0/469         |
| trailties        | 2419        | 2541        | 133      | 11      | 0       | 8           | 223/2419       | 223/2541      |
| **Total**        | **23275**   | **24399**   | **1239** | **115** | **187** | **29**      |                |               |

The extractor counts and the comparer's denominators differ slightly (gated
and generated tests), so read the two pairs of columns separately. Overall
matched tests go from 19579/26347 (74.3%) to 19496/27466 (71.0%).
`abstractcontroller`'s tests did not change.

**What this means for the plan.** The burn-down is on the order of 288 files
to re-verify, 839 defs and 1,239 tests to port, and 227 defs and 115 tests to
remove: several hundred PRs at the house PR size. activerecord is 53% of the
drifted pins and 45% of the new tests. The version-string surface is small:
103 versioned citations in 47 files, the `gem-version.ts` constants in six
packages, `ActionDispatch`'s `VERSION`, and the generated schema-parity
`Gemfile`.

#### How the size was measured

`parity:api:drift` already extracts the candidate's Ruby API to
`output/rails-api@v8.1.4.json` without touching `sources.ts`. For the dry run,
the Rails packages of that manifest were merged over a copy of
`output/rails-api.json`, and each `rails-comparison` step from ci.yml was run
against it in order. The test side used `extract-ruby-tests.rb` with
`TEST_PATHS_JSON` rewritten to the candidate directory. Both artifacts are
gitignored and were restored afterwards. This is the procedure
`bump-dry-run-runs-the-gates-against-a-candidate-ref` turns into a command.

Two things the existing drift report does not give: its `ported` flag counts
41 of activerecord's 307 changed methods as ported where 388 pins drift, and
there is no test-side report at all.

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
   against 8.0.2 cannot be pinned at the 8.1.4 digest by accident.
6. **Empty means deleted.** The RFC closes when the file has no rows and is
   removed. No trails release is tagged while a ledger has rows (§ 5).

The ledger is a new deviation register, and CLAUDE.md § "A documented deviation
is debt, not permission" applies to it in full: a row is "not yet re-verified",
never "accepted". What makes it different from a baseline row is that nobody
authors one. Its contents are a function of two upstream tags.

It needs the pin floor to be complete. 77 unpinned matched pairs change in
this bump and 13 of the 183 new gate rows sit on them; with no pin there is no
DRIFT row to seed from. Hence the entry criterion in § 4.

**How many rows.** 728 DRIFT and 125 STALE are measured against today's pins.
Both become ledger rows: DRIFT as `kind: "drift"`, STALE as `kind: "removed"`.
Retaking the floor first pins the 77 changing pairs, which then drift too. So
the pair seed at the flip is **about 930 rows** (853 + 77, plus any unpinned
pair that upstream removed, which today's measurement cannot see). The dry run
after the floor is retaken gives the exact figure, and that figure is what
§ Verification checks.

#### The test half

Tests have no pins, so the test seed is computed from the two
`rails-tests.json` manifests directly. Measured the same day:

| Package          | Tests at the same path whose assertions or gate changed | Share of the package's tests trails matches |
| ---------------- | ------------------------------------------------------- | ------------------------------------------- |
| activerecord     | 68                                                      | 99.7%                                       |
| trailties        | 71                                                      | 9%                                          |
| activesupport    | 39                                                      | 90%                                         |
| actioncontroller | 22                                                      | 85%                                         |
| actiondispatch   | 15                                                      | 69%                                         |
| activejob        | 12                                                      | 0%                                          |
| actionview       | 7                                                       | 29%                                         |
| activemodel      | 2                                                       | 100%                                        |
| **Total**        | **236**                                                 |                                             |

Only a matched test gets a row, so 236 is a ceiling for `changed` rows;
weighting each package by its matched share puts the seed near 150. arel adds
187 `moved` rows, some of which also changed (its assertion marks grow from 0
with no same-path change). The exact matched subset needs the comparer's
per-test output and is an acceptance criterion of
`bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests`.

The 115 tests removed upstream and the 1,239 added get no row. A removed
test's port becomes a TS-only extra, and a new test is a missing one; neither
is counted by a ratchet the dry run saw go red. Whether the test-name ratchet
counts either is part of Open question 7.

#### Every gate, and what makes it green at the flip commit

| Gate                                  | Disposition                      | Owned by                                                                  |
| ------------------------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Body-pins gate                        | ledger                           | `bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it`        |
| Call-mismatches ratchet               | ledger                           | `bump-ledger-scopes-the-call-ratchets-off-drifted-pairs`                  |
| Ratchet baseline reseed drift         | ledger                           | same                                                                      |
| Call-argument ratchet (shape, naming) | ledger                           | same                                                                      |
| Receipt audit gate                    | ledger                           | same                                                                      |
| Ruby-compat call ratchet              | ledger                           | same                                                                      |
| Missing-throw arm ratchet             | ledger                           | `bump-ledger-scopes-the-signature-and-surface-ratchets-off-drifted-pairs` |
| Extra-surface ratchet                 | ledger (`removed` rows)          | same                                                                      |
| Parameter-name ratchet                | ledger                           | same                                                                      |
| Block-parameter ratchet               | ledger                           | same                                                                      |
| Test comparison (gate-mismatch)       | ledger (test rows)               | `bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests`            |
| Assertion-mismatch ratchet            | ledger (test rows)               | same                                                                      |
| Vendor citations                      | mechanical flip commit           | `flip-the-rails-ref-to-v8-1-4` (`vendor:recite`)                          |
| Inlined-from citation spans           | mechanical flip commit           | same (`parity:api:inlined:fix`)                                           |
| Rails-private JSDoc lint and artifact | mechanical flip commit           | same (regenerated manifest, the rule's autofix)                           |
| Method-order lint (arel, activemodel) | mechanical flip commit           | same (regenerated manifest, `pnpm lint --fix`)                            |
| Test-name ratchet                     | residual: `moved` rows, untested | `bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests`            |
| Fixtures and models comparison        | residual: not exercised          | `bump-dry-run-runs-the-gates-against-a-candidate-ref`                     |
| Schema Parity, Query Parity           | residual: not exercised          | same                                                                      |

A stale row or receipt on a ledgered pair is not reported while the pair is
ledgered and is deleted by the burn-down story that re-verifies the pair. One
on a pair outside the ledger is deleted by hand in the flip PR. The four
"mechanical" rows marked as not exercised in § Motivation are expected to be
mechanical because each has a generator or an autofix; the dry-run story
confirms that or moves the row to residual. "`main` is green from the flip
commit" holds when no residual row is left, which is what Open question 7
tracks.

#### What the flip PR contains

One PR, mechanical throughout, in separate commits:

1. `ref: "v8.1.4"` in `vendor/sources.ts` and the re-locked
   `vendor/sources.lock.json`.
2. The seeded ledger.
3. `pnpm vendor:recite` (103 citations, 47 files), as its own commit.
4. Deletions the bump makes stale on pairs outside the ledger, by hand, with
   the marks tightened and no reseed. Today's stale set is 2 call rows, 3
   argument rows, 5 `@missingRailsCall` tags, 1 `@missingRailsName` receipt and
   2 `@inventedArm` receipts; the dry run says which of them sit on ledgered
   pairs and so wait for the burn-down.
5. Regenerated artifacts: the rails-private, deprecation, method-order and
   test-name manifests, the conventions doc and the schema-parity `Gemfile`.
6. Version constants Rails states as literals: `gem_version.rb`'s `MAJOR`,
   `MINOR`, `TINY` in each package's `gem-version.ts`, and
   `ActionDispatch`'s `VERSION`.
7. The regenerated `mirrors` fields (§ 6), if that check has landed.

Anything a gate still reports after that, on a unit outside the ledger, is
fixed in the flip PR. Today that is the 2 call rows on pairs an upstream
rename newly matches. The dry run exists to make that set known, and small,
before the PR is opened. The gates the dry run could not exercise (listed in
§ Motivation) are the risk; if one cannot be made green mechanically, the flip
PR stops and the gap becomes a tooling story, not an exception.

#### Options compared

- **One flip PR, burn-down on `main`, with the ledger (recommended).** `main`
  is green from the flip commit. Every other gate keeps full strength on every
  unit upstream did not change, which is over 90% of the pins. Burn-down PRs branch
  from `main`, are file-sized, and are independent of each other. Cost: a
  tooling change to roughly a dozen lint scripts, and a `main` that is a mix of
  8.0.2-verified and 8.1.4-verified bodies until the ledger is empty.
- **One flip PR, burn-down on `main`, no gate change.** What the procedure
  says today. `main` is red on thirteen gates for the whole burn-down, so every
  unrelated PR is red too and a new regression is indistinguishable from the
  backlog. Rejected.
- **One flip PR that also clears the gates.** Either the PR carries the
  re-verification (hundreds of files, against "PRs are small"), or it re-pins
  and reseeds to go green (against "never re-pin to silence the gate" and
  "baselines never widen"). Rejected.
- **A long-lived `rails-8-1` branch, merged when green.** Burn-down PRs would
  target the branch, which the no-stacking rule forbids as written, and CI
  triggers on `main` only. `main` lands many PRs a day, each verified
  against 8.0.2 and each touching the same baseline shards and `body-pins.json`
  the branch rewrites, so the branch pays a growing merge and re-verification
  tax and ends in one unreviewable merge. Rejected.
- **Pre-port against the candidate tree before the flip.** The gates measure
  8.0.2 until the flip. A body changed to match 8.1.4 gains call and argument
  rows against 8.0.2, and a method that exists only in 8.1.4 is unreceipted
  extra surface in packages pinned at `novel === 0`. Only the tooling, the dry
  run and the story generation can be done ahead. Rejected for porting; adopted
  for sizing.
- **Flip one package at a time.** A `ref` per package would cut the blast
  radius, but activerecord alone is 388 drifted pins, so the ledger is still
  needed, and two active Rails versions at once doubles the citation and
  registry rules RFC 0159 just simplified. Rejected.

#### Parallel work during the burn-down

- An agent on an unrelated story sees a green `main` and unchanged gates.
- An agent touching a ledgered method reads `vendor/rails/v8.1.4/`, the only
  active tree. `v8.0.2` stays fetchable beside it
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
   matched since then by ports that did not pin their file. `pnpm
parity:api:pins:all` retakes the floor in one PR immediately before the
   flip. A floor pin claims only "this is the tree the port was written
   against", which is true of every one of them.
3. **Every gate is green on `main` at the commit the flip merges onto.** The
   flip PR is rebased onto a `main` commit whose CI run is green and merges
   with nothing landing in between; trails merges by squash only, so that
   commit is the flip commit's single parent and gets the tag.

**Criterion 4, ruled by the owner on 2026-10-13 (Open question 5).** **The data layer is closed out: arel, activemodel and activerecord at 100%
on `parity:api` and `parity:test`, and RFC 0175 closed.** Methods are there
today; activerecord tests are 8801/8830. The reason is the tag:
`rails-8.0.2` should mark a complete data layer, and the 0175 stories still
open cite 8.0.2 `file:line`.

What waiting costs: RFC 0175 has 45 of 130 stories open (13,900 est-loc),
2 of them blocked. It closed 82 in the 14 days since 2026-09-30, 52 of
those in the last two. At the 14-day average that is about 8 more days;
the five tooling stories of this RFC (about 2,350 est-loc) have to merge
first in any case, so the wait added by criterion 4 is between zero and
roughly a week. If the tooling is merged and only blocked 0175 stories
remain, they are carried across the flip and no longer hold it.

**Need not be true:**

- actionpack, actionview, activejob or trailties parity. The flip moves their
  denominators and their ledger rows; it does not need them finished, and
  waiting for trailties (9% of tests) would defer the upgrade indefinitely.
- Pins on the non-Rails gems (thor has 367 unpinned). Each gem's own bump
  retakes its own floor.
- RFC 0100, any published package, or the version-scheme ruling. Those gate
  the first release (§ 6), not the flip.
- An empty `call-mismatches-exclude/` or zero receipts. Existing debt on
  units upstream did not change is unaffected by the bump.

### 5. Branching and tagging

Recommended; branch policy is the owner's (Open question 6).

- **Every Rails flip tags its parent `rails-<old>`.** The rehearsal flip's
  parent gets `rails-8.0.2`, the complete data layer on the tree it was
  ported against, and the 8.1.4 flip's parent gets `rails-8.0.5.1`, the last
  8.0 commit. Each is an annotated tag placed once its flip has merged, with the parity
  summary in its message. trails allows squash merges only, so the flip
  commit has exactly one parent. Tagging after the merge removes the race in
  which another PR lands between a pre-placed tag and the flip. If that
  parent's own `main` CI run was red, it is tagged anyway and the message
  records the run and the failing job: the name means "the last commit whose
  source of truth was this Rails version", and the flip PR's green CI on that
  same tree is the evidence that the red was not in what the tag describes.
  Release tags, once there are releases, are `v<trails-version>`, so the two
  namespaces never collide whichever version scheme is chosen.
- **No stable branch until a backport needs one.** Nothing is published, so
  nothing can need a fix on the 8.0 line. A tag costs nothing and a branch can
  be cut from it at any later time. Creating `8-0-stable` now would add a
  second place for agents to land work and a CI configuration nobody
  exercises.
- **After publishing, the same rule holds.** At each Rails minor flip, tag
  `rails-<old>`. Cut `<major>-<minor>-stable` (Rails' own spelling) from that
  tag only when a published release line exists for it and a fix has to ship
  there. At that moment ci.yml's `branches: [main]` gains the branch. A fix
  lands on `main` first and is cherry-picked back; a stable branch never
  receives a port `main` does not have.
- **No release tag while a ledger has rows.** A release is cut from a commit
  where every ported body is verified against one Rails version.
- **A Rails patch release (8.1.4 → 8.1.5) is the same procedure at a smaller
  size.** It tags its parent `rails-<old>` like any Rails flip, since the tag
  is free and is how a later reader finds the commit. No branch, no
  version-scheme change. Run the
  dry run; if the ledger seed and the fixes fit one PR, the bump is one story
  with no ledger file; if not, it seeds a ledger and burns down like a minor.
  For scale, 8.0.2 → 8.0.5.1 (three patches and three security releases) is
  169 changed bodies, under a fifth of the 8.1 bump, and it does need a
  ledger. Patches are taken promptly:
  a security release is the one upstream change a published trails cannot sit
  behind.

### 6. Version numbers

The owner's decision (Open question 2). Three schemes were asked for:

- **(a) trails keeps its own semver; 1.0 is a milestone independent of
  Rails.** Honest semver, and `0.x` says "not finished" about a stack where
  trailties passes 9% of Rails' tests. A trails-only fix is a patch and a
  breaking TS-only change is a minor (pre-1.0) or a major. Cost: the version
  says nothing about which Rails is mirrored, so every user needs a mapping
  table, and "1.0" becomes a second definition of done beside parity.
- **(b) trails matches Rails' `major.minor`, with its own patch counter.** The
  first stable release on this line is `8.1.0`; there is no 1.0.
- **(c) trails matches Rails' full version.** A trails-only fix has no number:
  `8.1.4.1` is not semver, `8.1.4-1` sorts before `8.1.4`, and npm ignores
  `8.1.4+1`. Rejected.

**Recommendation: (b), with these rules.**

- **`major.minor` is the mirrored Rails minor. `patch` is trails' counter.**
  It rises for a trails-only fix, for a newly ported method or test, and for a
  Rails patch bump. It is not Rails' `TINY`: trails `8.1.7` may mirror Rails
  `8.1.4`.
- **Maturity is carried by prerelease tags, not by `0.x`.** Until a package
  group meets its stated completeness bar it publishes `8.1.0-alpha.N` /
  `-beta.N` / `-rc.N`. npm does not resolve a prerelease from a caret or tilde
  range, so nobody gets one without asking. If Rails 8.2 is flipped while the
  line is still prerelease, the next is `8.2.0-alpha.1`.
- **A breaking TS-only change** lands at a Rails minor boundary. One that
  cannot wait ships in a patch with a changelog entry that leads with it. That
  is the contract Rails itself gives: its minors may break, and it does not
  claim strict semver.
- **What npm consumers should expect.** `^8.1.0` admits `8.2.0`, and a Rails
  minor carries behaviour changes and removed deprecations. Document `~8.1.0`
  as the supported range, and publish every inter-package dependency as an
  exact version (pnpm rewrites `workspace:*` to one), so a consumer's packages
  cannot straddle two Rails minors.
- **Which packages version together.** One rule: _a package that mirrors an
  upstream gem takes that gem's `major.minor`; a package with no upstream owns
  its semver._ The Rails-source packages (arel, activemodel, activerecord,
  activesupport, actionpack, actionview, activejob, trailties) are one fixed
  group that always releases together, as Rails' gems do. A gem port follows
  its gem (`rack` 3.2.z, `i18n` 1.14.z, `globalid` 1.3.z, `bcrypt` 3.1.z).
  ruby-compat, trails-tsc, tse-compiler and activerecord-cli have no upstream
  version and stay on plain semver.
- **The mirrored ref is recorded twice.** In each `package.json`, a generated
  `mirrors` field: `{ "source": "rails", "ref": "v8.1.4", "sha":
"c3466ea00d71…" }`, written from `sources.lock.json` and checked in CI so it
  cannot drift from the registry. It is regenerated in the flip PR, so the
  check is never off. `mirrors.ref` therefore means "the ref the gates measure
  this package against". It does not claim every body is verified against
  that ref; the absence of a ledger file for the source does, and that is the
  condition a release is cut on (§ 5). And at run time, where Rails already puts
  it: the ported `gem_version.rb` constants, so `ActiveRecord.version` answers
  Rails' `8.1.4` and `Migration.current_version` answers `8.1`, whatever the
  npm patch counter says.
- **RFC 0100.** It changes what a tarball contains and which entrypoints
  reach the native drivers. Under (b) no major is available to announce that
  after a stable `8.1.0`, so RFC 0100 must land before the first stable
  release. It need not land before a prerelease or before the flip.

The alternative, spelled out: under **(a)** the first release is `0.2.0` or
similar, the `mirrors` field and the `gem-version.ts` constants are the only
places Rails' version appears, packages may still release as a fixed group,
and RFC 0100 can land in any `0.x` minor. Choose (a) if a version that
promises nothing matters more than one that names its Rails.

**Should the first public release wait for 8.1, or ship on 8.0.2?
Recommendation: wait for 8.1** (Open question 3). A release mirroring `v8.0.2`
would knowingly omit three upstream security releases (`8.0.2.1`, `8.0.4.1`,
`8.0.5.1`); it would open an 8.0 release line that needs a stable branch and
backports the day `main` flips; and under (b) it would spend the `8.0` minor
on a line abandoned weeks later. The earliest stable release is the first
commit after the Rails 8.1 ledger is empty at which RFC 0100 has landed.
Prereleases may start sooner, from any green commit with an empty ledger. The
alternative is an `8.0.0-alpha` snapshot cut from the `rails-8.0.2` tag for
early feedback; it commits to nothing, and it is the owner's call whether the
feedback is worth a tarball RFC 0100 has not yet slimmed.

### 7. The repeatable version

8.2 will come, and so will 8.1.5. What this RFC leaves behind:

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
Today's measurement is backfilled as the first report, marked as transcribed
by hand. The rehearsal's retrospective reads its figures back out of these
tables, which is the first use of them.

The runbook, as it will be written into vendor/README.md § "Upgrading a
source":

1. Resolve the target tag from the upstream remote. Read its `Gemfile.lock`
   against `sources.lock.json` and apply the dependent-source rule of § 1.
2. Fetch the candidate beside the active version. Run the dry run. Put its
   tables in the upgrade RFC.
3. Check the entry criteria. Retake the pin floor for the source's packages.
4. Open the flip PR: `ref`, lockfile, seeded ledger, recite, stale deletions,
   regenerated artifacts, version constants, `mirrors` fields.
5. For a minor: once it merges, tag its parent commit `rails-<old>`.
6. Generate the burn-down stories and write their ids into the ledger rows.
7. Burn down: re-verify, re-pin, delete the row. Port what is new. Delete what
   is gone.
8. When the ledger is empty: delete it, re-read the rewritten citations,
   `pnpm vendor:fetch --prune`, close the RFC.
9. Bump the dependent sources by the same steps, smallest first.

Documents that change, in `document-the-minor-bump-runbook`:

- **vendor/README.md.** § "Scoping a Rails bump" points at the dry run.
  § "Upgrading a source" gains the entry criteria, the tag, the ledger and the
  flip PR's contents, and step 6 stops implying the DRIFT list is burnt down
  with the gate red. § "What the parity gates do across a bump" gains the
  table from § Motivation and the ledger rules. The stale `## Status` wave
  table is dropped.
- **CONTRIBUTING.md § "Body pins".** "When the gate fails: DRIFT" describes a
  ledger row during a bump, and `--pin` deletes the row it clears.
- **CLAUDE.md.** The register list in § "A documented deviation is debt, not
  permission" names the bump ledger; "Before you open the PR" gains one line
  on touching a ledgered unit. Its `vendor/rails/v8.0.2/` citations move with
  `vendor:recite`.

## Non-goals

- **Porting any Rails 8.1 code.** The burn-down is a separate RFC generated by
  `generate-the-rails-8-1-burn-down-stories`.
- **Publishing.** RFC 0100 and a future release RFC own the tarball, the
  registry and the release automation. This RFC decides the numbers and what a
  release may be cut from.
- **Migration version compatibility.** `Migration::Compatibility` gains a
  `V8_0` in 8.1; that surface is already out of scope for trails.
- **The newly unported 8.1 surface in activejob and trailties.** It lowers
  two percentages and adds no gate failure.
- **Changing what any ratchet measures.** The ledger changes which units a
  ratchet counts during a bump, and nothing about how a unit is scored.
- **Trilogy.** Its resolved version moved (2.9.0 → 2.12.5); it is never
  ported.

## Alternatives considered

The transition strategies are compared in § 3, the version schemes in § 6 and
the targets in § 1. Two more:

- **Make DRIFT advisory during a bump.** A flag that downgrades the body-pins
  gate to a warning greens one gate and leaves nine red, since the call and
  argument rows are the same changed bodies seen by other gates.
- **Receipt each changed pair at its declaration** (`@missingRailsCall` and
  friends, `CONVERGEABLE <story>`). It reuses machinery that exists, but it
  writes roughly a thousand JSDoc tags into source that are all deleted again,
  each one authored by hand and reviewable only by re-deriving the diff. The
  ledger holds the same information in one generated file.

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
3. **Rehearsal, 8.0.2 → 8.0.5.1.** `flip-the-rails-ref-to-v8-0-5-1`, then
   `tag-the-last-rails-8-0-2-commit` on its parent and
   `generate-the-rails-8-0-5-1-burn-down-stories`. The burn-down runs in the
   generated RFC. `retire-the-rails-8-0-5-1-ledger-and-review-the-rehearsal`
   closes it and re-measures the 8.1 bump.
4. **Flip, 8.0.5.1 → 8.1.4.** `flip-the-rails-ref-to-v8-1-4`, then
   `tag-the-last-rails-8-0-5-1-commit` on its parent.
5. **Post-flip.** `generate-the-rails-8-1-burn-down-stories`,
   `reread-the-recited-rails-citations-against-v8-1-4` and
   `size-and-sequence-the-dependent-source-bumps` in parallel, then
   `document-the-minor-bump-runbook`, which waits for the generator.
6. **Burn-down.** In the generated RFC, not here.
7. **Close.** `retire-the-rails-ledger-and-prune-v8-0-2`, then, once the
   owner has ruled on Open question 2, `adopt-the-ruled-version-scheme`.

Story clusters are the phase names: `tooling`, `entry`, `rehearsal`, `flip`,
`post-flip` and `close`.

## Verification

- The rehearsal closes with an empty, deleted ledger at `v8.0.5.1`, a
  retrospective in this RFC, and re-measured 8.1 figures replacing the ones
  below.
- The stats DB answers, for each of the two Rails bumps: rows predicted, rows
  at the flip, and days from flip to empty ledger.
- Before each flip: the dry run on `main` reports **0** red gates on units
  outside the ledger seed, and **0** unpinned matched bodies in the Rails
  packages (898 today).
- The flip PR's CI is green, and so is the first unrelated PR merged after it.
- At the flip commit the Rails ledger holds exactly the rows the dry run
  computes after the floor is retaken: about 930 pair rows (728 drift, 125
  removed, and the 77 newly pinned pairs that change) and the test rows of
  § 3 "The test half" (at most 236 changed and 187 moved). It only shrinks
  from there. `git log -p` on the file
  shows no added row outside a lockfile `ref` change.
- At close: the ledger file is gone, `pnpm parity:api:pins` reports 0 DRIFT
  and 0 STALE with `rails` at `v8.1.4`, `git grep 'vendor/rails/v8\.0\.2'` is
  empty, and no call, argument, parameter, block, arm, extra-surface or
  assertion baseline or mark is wider than at the `rails-8.0.2` tag.
- `vendor/README.md` holds a runbook that names every command used.

## Open questions

<!-- Every question here must be resolved or explicitly deferred (to a named
     follow-up RFC/story) before this RFC moves to `status: active`. -->

1. **Is the bump ledger acceptable?** (Owner.) It suspends the per-unit
   ratchets on about 930 pairs and up to 423 tests for the length of the
   burn-down, which is a new
   register in a repo whose rule is that registers only shrink.
   Recommendation: yes, because its rows are generated from two upstream tags
   and it is the only option that keeps `main` green without widening a
   baseline. Alternative: accept a red `main` on thirteen gates for the burn-down,
   with a merge freeze on everything but burn-down PRs.
2. **Version scheme.** (Owner.) Recommendation: (b), Rails' `major.minor` with
   trails' patch counter, prerelease tags for maturity, gem ports following
   their own gems. Alternative: (a), own semver from `0.x` with the Rails ref
   in metadata only. § 6.
3. **Release timing.** (Owner.) Recommendation: no public release on 8.0.2;
   the first stable release follows the 8.1 burn-down and RFC 0100.
   Alternative: an `8.0.0-alpha` snapshot from the `rails-8.0.2` tag.
4. **Rehearse on `v8.0.5.1` first?** **Resolved 2026-10-13: yes.** Measured
   after the first draft: 132 of the 169 bodies that change in 8.0.5.1 are
   identical in 8.1.4, so the repeated work is about 37 bodies, and the
   bcrypt-ruby bump first proposed as the rehearsal is too small to need a
   ledger at all. § 1 "Two flips".
5. **Is closing RFC 0175 an entry criterion?** **Resolved 2026-10-13: yes.**
   The owner ruled that RFC 0175 finishes before the flip; it is being burned
   down now. Criterion 4 of § 4 is therefore a hard entry criterion, and the
   alternative of carrying 0175's open stories across the flip is not taken.
6. **Branch policy.** (Owner.) Recommendation: tags only; a
   `<major>-<minor>-stable` branch is cut lazily from the tag when a published
   line needs a fix. Alternative: cut `8-0-stable` at the flip so the 8.0.2
   data layer can keep receiving fixes.
7. **Does the ledger cover gates the dry run could not exercise?** The
   rails-private, method-order and test-name lints and the two real-Rails
   parity jobs may report new debt at the flip that is not keyed by pair or
   test. Deferred to `bump-dry-run-runs-the-gates-against-a-candidate-ref`,
   which must either exercise them or list them as residual risk with a count.

## Changelog

- 2026-10-13: initial RFC
- 2026-10-13: Open question 5 resolved by the owner: RFC 0175 closes before
  the flip.
- 2026-10-13: Open question 4 resolved by the owner: rehearse on `v8.0.5.1`.
  Five stories added (three rehearsal stories, the `rails-8.0.5.1` tag, the
  stats-DB history), the rollout re-sequenced, and every Rails flip now tags
  its parent.
- 2026-10-13: review round 1. Ledger seed restated post-floor (about 930
  pairs) and the test half sized; one disposition per gate; `mirrors`
  regenerated at the flip; entry criterion 4 made owner-ruled with a bound on
  the wait; tag placement on a squash merge; clusters renamed to the rollout
  phases; RFC 0159's floor and procedure stories cited.
