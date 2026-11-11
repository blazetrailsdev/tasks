---
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
title: "Rails 8.0.5.2 upgrade workflow: the first bump of the source of truth, the bump ledger that keeps main green, and the scoping of 8.1"
status: active
created: 2026-10-13
updated: 2026-11-10
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
  - "actioncable"
  - "actionmailer"
  - "activestorage"
  - "actionmailbox"
  - "actiontext"
  - "html-sanitizer"
  - "nokogiri"
  - "rack"
  - "rack-session"
  - "bcrypt"
  - "pg"
  - "sqlite3"
  - "thor"
  - "zeitwerk"
  - "mini-magick"
  - "solid-queue"
  - "solid-cable"
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

# RFC 0191 — Rails 8.0.5.2 upgrade workflow

## Summary

trails mirrors Rails `v8.0.2`. This RFC plans its first move of that source
of truth: to **`v8.0.5.2`** (commit `235c597b100321b6bd2d62f8df63707f42b25b2d`,
annotated tag object `3ada6507aac5e05bf097c1213649d5076826db02`, released
2026-11-04), the highest 8.0 tag and, by Rails' maintenance policy, very likely
the last release of the 8.0 line (§ 1). It decides sequence, gating and
tagging. It ports no Rails code and holds no porting stories: the burn-down is
one story here that generates a separate RFC after the flip.

The RFC was first drafted for `v8.1.4`. The owner ruled on 2026-10-13 to do
the 8.0 line's last release first (then `v8.0.5.1`; retargeted to `v8.0.5.2`
on 2026-11-10 when that security release shipped), as its own upgrade, and to plan 8.1 afterwards from what
this one teaches. The 8.1 measurements are kept in § 8, and the last story
here writes the 8.1 RFC.

The mechanical procedure exists (vendor/README.md § "Upgrading a source
(bumping `ref`)", designed by RFC 0159). What it does not answer is how `main`
stays green between the one-line `ref` bump and the last re-verified body. A
dry run of every gate against the `v8.0.5.1` manifests (2026-10-13) showed the
bump turns **ten CI gates red at once**, on **141 drifted and 12 stale body
pins across 82 Ruby files**, and no baseline may widen to absorb it.
`v8.0.5.2` adds 20 commits on top: 36 more changed Ruby files under ported
paths, all security fixes (§ 1, "What 8.0.5.2 adds"), so the measured figures
are a floor and the dry-run story re-measures them at the new target.

The recommendation is one flip PR on `main` followed by a burn-down on `main`,
made possible by a **bump ledger**: a committed, only-shrink list of the ported
units whose upstream definition changed, which scopes the per-unit ratchets off
those units until each is re-verified. The owner accepted the ledger on
2026-11-10; the branch policy is deferred to the tag story. Every dry run, flip and ledger
count is kept in the stats DB (§ 7).

## Motivation

### Where we are

The per-package table was re-taken on trails `876804dd8b` on 2026-11-11 for all
sixteen `rails`-source packages, and it now lives in the § "Findings" of
`entry-check-data-layer-parity-is-closed-on-8-0-2`. In short: arel is at
100%, activemodel is at 820/821 methods and 1037/1037 tests, and activerecord
is at 6987/6991 methods and 8940/8965 tests. Every package is at version
`0.1.0`, nothing is published, and trails has no release tags.

### What the bump does to `main` today

None of this was assumed. `pnpm parity:bump:dry-run --source rails --ref
v8.0.5.2` (trails `bump-dry-run-runs-the-gates-against-a-candidate-ref`)
ran each gating step of ci.yml's `rails-comparison` job against the
`v8.0.5.2` Ruby manifests on 2026-11-10, over all sixteen Rails packages, and
left every tracked file byte-identical. It first re-cites the `@inlinedFrom`
tags at the candidate's spans, as the flip PR will (`parity:api:inlined:fix`
rewrites 41 files, 7 of whose tags cite a changed file), then restores them.
Percentages are not gated; ratchets are.

| Gate (ci.yml step)                                                                                                                                                           | Result at the flip commit                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Body-pins gate                                                                                                                                                               | **red**: 182 DRIFT, 15 STALE (`lint-body-pins.ts` exits 1 on either)       |
| Call-mismatches ratchet                                                                                                                                                      | **red**: 28 new rows                                                       |
| Ratchet baseline reseed drift                                                                                                                                                | **red**: follows from the call-mismatches rows                             |
| Call-argument ratchet                                                                                                                                                        | **red**: new shape rows, 7 naming failures, 1 stale `@missingRailsArgs`    |
| Missing-throw arm ratchet                                                                                                                                                    | **red**: 2 dimensions grow                                                 |
| Parameter-name ratchet                                                                                                                                                       | **red**: activerecord `tasks/database_tasks.rb` 0 → 1                      |
| Block-parameter ratchet                                                                                                                                                      | **red**: `try` / `try!` (activesupport)                                    |
| Extra-surface ratchet                                                                                                                                                        | **red**: actioncable total 0 → 1                                           |
| Inlined-from staleness gate                                                                                                                                                  | **red**: 1 finding after the re-cite (`LoggerThreadSafeLevel#initialize`)  |
| Test comparison (`--gates --check`)                                                                                                                                          | **red**: 1 activerecord gate-mismatch against a hard zero                  |
| Assertion-mismatch ratchet                                                                                                                                                   | **red**: marks grow (actioncontroller assertion-count 0 → 7, among others) |
| Vendor citations (Preflight)                                                                                                                                                 | **red** until `pnpm vendor:recite` runs                                    |
| API comparison, privates, calls, extra-surface tags, receipt audit, ruby-compat calls, predicate-kind, class-path table, ambiguous-parent, dependency lint, AR-closure guard | green                                                                      |

Not exercised, because each reads the active version directory or runs real
Rails; the dry run reports the upstream count that predicts each instead
(Open question 3): the rails-private JSDoc lint and its runtime artifact (220
lib files change), the method-order lint (14 arel and activemodel lib files),
the test-name ratchet (8 actionview test files), the fixtures comparison (2
fixture files) and models comparison (7 model files), and Schema Parity and
Query Parity. The schema-parity `Gemfile` can be generated for the candidate
(`activerecord 8.0.5.2` is the tag's `RAILS_VERSION`), and the canonical-schema
delta is `authors.published_author_id`, `book_identifiers` and
`cpk_posts_tags` with their columns, plus `postgresql_specific_schema.rb`.

So the procedure as written produces a `main` that stays red for as long as
the burn-down takes, with every parallel agent's PR red behind it. Three rules
make the obvious escapes unavailable: PRs branch from `main` and are never
stacked, PRs are small, and no baseline widens.

### Why the new rows cannot simply be fixed in the flip PR

Every new call and call-argument row was attributed to its matched pair by
the dry run (`v8.0.5.2`):

| New rows on a pair whose…             | Calls | Arguments | Params | Blocks | Arms |
| ------------------------------------- | ----- | --------- | ------ | ------ | ---- |
| pin DRIFTED                           | 21    | 21        | 2      | 1      | 2    |
| body changed but the pair is unpinned | 3     | 5         | 0      | 0      | 1    |
| TS file holds a seeded pair           | 0     | 1         | 0      | 0      | 0    |
| none of these                         | 0     | 0         | 1      | 2      | 0    |

The three unattributed rows sit on unchanged Ruby bodies:
`DatabaseTasks#schema_up_to_date?`'s parameter name and `Object#try` /
`#try!`'s block parameter, which the candidate's re-extracted manifest reads
differently. At `v8.0.5.1` the same attribution gave 17 + 3 call rows and
17 + 3 + 1 argument rows, with the same three residue rows.

Every new row is the same fact as a changed Ruby body. Fixing them is the
burn-down. The table also shows what the pin floor is worth: with every
matched pair pinned, a new row cannot appear on a pair the DRIFT list does not
already name. The same held for `v8.1.4`, where all 183 new rows sat on
changed bodies.

## Design

### 1. Target and scope

**Decision (owner, 2026-10-13): `rails` moves from `v8.0.2` to `v8.0.5.2`.
The 8.1 upgrade is a separate RFC that follows this one.**

`v8.0.5.2` was resolved on 2026-11-10 with `git ls-remote --tags
https://github.com/rails/rails 'v8.0*'`: it is the highest 8.0 tag, and
`refs/tags/v8.0.5.2^{}` is commit `235c597b100321b6bd2d62f8df63707f42b25b2d`.
`vendor:fetch` locks the commit SHA, not the tag object. It takes in three
patch releases (`8.0.3`, `8.0.4`, `8.0.5`) and four security releases
(`8.0.2.1`, `8.0.4.1`, `8.0.5.1`, `8.0.5.2`).

**The 8.0 line is at the end of its maintenance window.** Rails' policy
(rubyonrails.org/maintenance, read 2026-11-10) gives 8.0.x bug fixes until
2026-05-07 and security fixes until **2026-11-07**. `v8.0.5.2` shipped three
days before that end, so no further 8.0 release is expected; a later 8.0
backport would be published to git only, not as a tag the rule below could
resolve. The target therefore does not move again. 8.1.x has security support
until 2027-10-10, and its highest tag is now `v8.1.4.1`
(`3f290b759c8e2ffe7c257951b1255740751355e4`), so the 8.1 RFC is on a
supported line. The practical consequence is that once this flip lands, the
only upstream security fixes trails can follow are on 8.1, which argues for
not letting the burn-down drag.

#### What 8.0.5.2 adds over 8.0.5.1

`v8.0.5.1...v8.0.5.2` is 20 commits and 95 files, released 2026-11-04, every
change a GHSA fix apart from the version strings. No 8.0.x patch release
(`8.0.6`) exists. Under the paths `vendor/sources.ts` maps (each package's
`libPath` plus `extraLibPaths`), measured with `git diff --shortstat`:

| Package          | Files | +/-      | What changed                                                                                                  |
| ---------------- | ----- | -------- | ------------------------------------------------------------------------------------------------------------- |
| activestorage    | 12    | +199/-30 | new `image_magick.rb` and `policy.xml`, analyzers, `engine.rb`, `blob.rb`, `filename.rb`, `streaming.rb`, GCS |
| actiondispatch   | 5     | +58/-8   | `mime_negotiation.rb`, `cookies.rb`, session `abstract_store.rb`, `cache_store.rb`, `cookie_store.rb`         |
| actionview       | 4     | +43/-13  | `sanitize_helper.rb`, `tag_helper.rb`, `text_helper.rb`                                                       |
| actioncontroller | 3     | +35/-14  | `live.rb`, `rendering.rb`, `strong_parameters.rb`                                                             |
| activesupport    | 2     | +3/-19   | `inflector/methods.rb` (`safe_constantize`)                                                                   |
| actionmailbox    | 2     | +2/-2    | mailgun ingress controller                                                                                    |
| every other      | 1     | +1/-1    | `gem_version.rb` only (activerecord, activemodel, actioncable, actionmailer, actiontext, activejob, railties) |

Tests: 36 test files change (+1,637/-111, one added shared file,
`actionpack/test/dispatch/session/store_shared_tests.rb`, plus
`activestorage/test/image_magick_test.rb` and
`railties/test/application/active_storage/engine_integration_test.rb`). The
activerecord test schema, models and fixtures do not change between `v8.0.5.1`
and `v8.0.5.2`; between `v8.0.2` and either they change in 11 files
(`schema.rb` +13: `authors.published_author_id`, `book_identifiers`,
`cpk_posts_tags`; `postgresql_specific_schema.rb`; 7 models; 2 fixture files),
none of which the canonical `test-schema.ts` has yet
(`mirror-the-v8-0-5-2-activerecord-test-schema-models-and-fixtures`).

Two consequences for this RFC beyond the size:

- **Five more Rails packages are in scope.** actioncable, actionmailer,
  activestorage, actionmailbox and actiontext were enrolled in
  `vendor/sources.ts` (`:171-221`) after the 2026-10-13 measurement, so their
  pins, tests and `gem-version.ts` constants (12 files now, against six) are
  part of the floor, the ledger seed and the flip. Over `v8.0.2...v8.0.5.2`
  activestorage alone changes 22 files (+436/-58).
- **A gemspec floor moved.** `actionview.gemspec` now requires
  `rails-html-sanitizer ~> 1.6, >= 1.7.2` (GHSA-2p2f-4rq4-gjwc), which in turn
  requires loofah `>= 2.25.3` and nokogiri `>= 1.19.5`. This is the first
  dependent source this RFC _must_ move rather than may.

Why this target first:

- **It is a fifth of the size.** 169 method bodies change, against 917 to
  `v8.1.4` (both measured from `v8.0.2` at `v8.0.5.1`; `v8.0.5.2` adds the
  bodies in the table above). The ledger, the dry run and the flip PR get
  their first real use on about 200 units, not about 930.
- **Most of it is 8.1 work anyway.** 132 of the 169 bodies changed by
  `v8.0.5.1` are byte-identical in `v8.1.4`, and 45 of the 46 added defs exist
  there. `v8.1.4.1` was released 14 minutes after `v8.0.5.2` with 21 GHSAs
  to 8.0.5.2's 19, so the 8.0.5.2 fixes are expected to carry over the same way; the 8.1 RFC's dry run confirms it.
- **It carries the security fixes** trails is currently four releases behind.

Bodies changed from `v8.0.2` to `v8.0.5.1` (2026-10-13; the dry run adds the
8.0.5.2 bodies and the five later-enrolled packages):

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

- **Go straight to `v8.1.4.1`.** One flip instead of two, and 8.1 sooner. The
  first use of the machinery would be on the large bump.
- **Stop at `v8.0.5.1`, as first drafted.** The flip has not happened, so
  retargeting costs one re-run of the dry run; stopping short would leave
  trails behind the nineteen GHSA fixes it carries on the line it mirrors.
- **Wait for 8.2.** No tag exists. Each release skipped makes the next diff
  larger.

**Dependent sources.** Two gemspec constraints change between `v8.0.2` and
`v8.0.5.2`: railties gains `tsort >= 0.2`, and actionview's
`rails-html-sanitizer` floor rises to `>= 1.7.2`. Otherwise what moves is
what `Gemfile.lock` resolves, compared here with `vendor/sources.lock.json` as
of 2026-11-10 (lock columns read from each tag's `Gemfile.lock`):

| Source                                                                                                  | Pinned  | 8.0.2 lock | 8.0.5.2 lock | 8.1.4 lock | Compare enrolled | Moves?                 |
| ------------------------------------------------------------------------------------------------------- | ------- | ---------- | ------------ | ---------- | ---------------- | ---------------------- |
| rails-html-sanitizer                                                                                    | 1.6.2   | 1.6.2      | 1.7.2        | not read   | api + tests      | **must** (gemspec)     |
| loofah                                                                                                  | 2.24.0  | 2.24.0     | 2.25.3       | not read   | api + tests      | **must** (sanitizer)   |
| nokogiri                                                                                                | 1.18.3  | 1.18.3     | 1.19.7       | not read   | api + tests      | **must** (loofah)      |
| rack-session                                                                                            | 2.1.0   | 2.1.0      | 2.1.1        | 2.1.2      | api + tests      | yes                    |
| thor                                                                                                    | 1.3.2   | 1.3.2      | 1.4.0        | 1.5.0      | api + tests      | yes                    |
| sqlite3                                                                                                 | 2.6.0   | 2.6.0      | 2.7.3        | 2.9.4      | api              | yes                    |
| pg                                                                                                      | 1.5.9   | 1.5.9      | 1.6.2        | 1.6.3      | api              | yes                    |
| zeitwerk                                                                                                | 2.7.2   | 2.7.2      | 2.7.3        | not read   | api + tests      | yes                    |
| mini_magick                                                                                             | 5.2.0   | 5.2.0      | 5.3.1        | not read   | api + tests      | yes                    |
| solid_queue                                                                                             | 1.1.3   | 1.1.3      | 1.2.1        | not read   | api + tests      | yes (dev Gemfile only) |
| solid_cable                                                                                             | 3.0.7   | 3.0.7      | 3.0.12       | not read   | api + tests      | yes (dev Gemfile only) |
| racc                                                                                                    | 1.8.0   | 1.8.1      | 1.8.1        | not read   | tests (anchor)   | yes                    |
| minitest                                                                                                | 5.27.0  | 5.25.4     | 6.0.0        | 6.0.6      | off (anchor)     | anchor                 |
| rails-dom-testing                                                                                       | 2.2.0   | 2.2.0      | 2.3.0        | 2.3.0      | off (anchor)     | anchor                 |
| rack                                                                                                    | 3.2.8   | 3.1.12     | 3.2.1        | 3.2.6      | api + tests      | no (pin leads)         |
| bcrypt-ruby                                                                                             | 3.1.20  | 3.1.20     | 3.1.20       | 3.1.22     | api + tests      | no                     |
| date                                                                                                    | 3.4.1   | 3.4.1      | 3.4.1        | 3.5.1      | tests only       | no                     |
| rack-test                                                                                               | 2.2.0   | 2.2.0      | 2.2.0        | 2.2.0      | tests            | no                     |
| i18n                                                                                                    | 1.14.8  | 1.14.7     | 1.14.7       | 1.14.8     | api + tests      | no (pin leads)         |
| globalid                                                                                                | 1.3.0   | 1.2.1      | 1.2.1        | 1.3.0      | api + tests      | no (pin leads)         |
| msgpack                                                                                                 | 1.8.0   | 1.8.0      | 1.8.0        | 1.8.0      | api + tests      | no                     |
| mysql2                                                                                                  | 0.5.6   | 0.5.6      | 0.5.6        | 0.5.6      | api              | no                     |
| tzinfo, marcel, mail, mini_mime, net-smtp, builder, erubi, crass, image_processing, rackup, solid_cache | = lock  |            | unchanged    |            |                  | no                     |
| did_you_mean                                                                                            | 1.6.3   | not locked | not locked   | not locked | api + tests      | no                     |
| ruby                                                                                                    | v3_3_11 |            |              |            | off (anchor)     | no                     |

Three pins already lead the 8.0.5.2 lock (rack, i18n and globalid), so "pin
equals Rails' lock" was never an invariant. The rule this RFC sets: **a
dependent source moves to the version the target Rails `Gemfile.lock`
resolves, unless its pin is already at or past it.** A gem that only Rails'
development `Gemfile` pulls in (solid_queue, solid_cable) follows the same
rule; `size-and-sequence-the-dependent-source-bumps` may argue it out with the
owner.

**Order: Rails first and alone, then each gem as its own bump; the gemspec
chain next, before the burn-down reaches the sanitizer helpers.** No pinned
gem blocks the Rails flip itself: the ported actionview code runs on trails'
own `html-sanitizer` package, which no gemspec check reads, and bumping a gem
first would put bodies verified against 8.0.2 on a gem version Rails 8.0.2
never ran against. But `v8.0.5.2`'s `sanitize_helper.rb`, `text_helper.rb`
(`highlight`, `simple_format`) and their new tests assume
rails-html-sanitizer 1.7.2's output, so the three-gem chain is bumped right
after the flip, nokogiri first, then loofah, then rails-html-sanitizer, each
its own story here (`bump-nokogiri-to-v1-19-7`, `bump-loofah-to-v2-25-3`,
`bump-rails-html-sanitizer-to-v1-7-2`), and the burn-down stories for those
two actionview files depend on the last. The remaining movers are sized after
the flip by `size-and-sequence-the-dependent-source-bumps`, which files one
story each and puts one question to the owner: whether a gem stops at the
8.0.5.2 lock's version, or waits and moves once with the 8.1 upgrade. A gem
bump may overlap the Rails burn-down, since the ledger is keyed per source.

Upstream diffs of the three chain gems (GitHub compare, 2026-11-10; `lib/`
and test directories only):

| Gem                  | Range             | Commits | lib files, +/- | test files, + |
| -------------------- | ----------------- | ------- | -------------- | ------------- |
| nokogiri             | v1.18.3...v1.19.7 | 169     | 29, +353/-151  | 39, +3,430    |
| loofah               | v2.24.0...v2.25.3 | 71      | 5, +225/-78    | 8, +856       |
| rails-html-sanitizer | v1.6.2...v1.7.2   | 57      | 3, +14/-21     | 4, +177       |

### 2. The size of the upgrade

All numbers are `v8.0.2` → `v8.0.5.2` (commit `235c597b`), measured
2026-11-10 by `pnpm parity:bump:dry-run --source rails --ref v8.0.5.2` over
all sixteen Rails packages, from a candidate fetched beside the active
version. No lockfile, baseline, mark or pin was touched.

**Ruby source and body pins**, under the `libPath` each package ports (`git
diff --no-index -M --numstat`; pins from `lint-body-pins.ts` and method parity
from `compare.ts`, both run on the merged `v8.0.5.2` manifest):

| Package                   | Files changed | +lines   | -lines  | Pins DRIFT | Pins STALE | Ruby files with either | Unpinned pairs that change | Methods before | Methods after |
| ------------------------- | ------------- | -------- | ------- | ---------- | ---------- | ---------------------- | -------------------------- | -------------- | ------------- |
| arel                      | 9             | 31       | 9       | 20         | 0          | 11                     | 0                          | 1052/1052      | 1052/1058     |
| activerecord              | 56            | 464      | 272     | 66         | 0          | 35                     | 3                          | 6987/6991      | 6989/7004     |
| activerecord-test-support | 1             | 1        | 1       | 0          | 0          | 0                      | 0                          | 43/58          | 43/58         |
| activemodel               | 5             | 19       | 17      | 1          | 0          | 1                      | 0                          | 820/821        | 820/821       |
| activesupport             | 40            | 286      | 213     | 27         | 12         | 12                     | 4                          | 2110/2266      | 2097/2257     |
| actiondispatch            | 18            | 170      | 56      | 21         | 1          | 14                     | 0                          | 1801/1809      | 1801/1816     |
| actioncontroller          | 6             | 85       | 25      | 9          | 0          | 5                      | 0                          | 852/854        | 852/859       |
| abstractcontroller        | 3             | 3        | 14      | 0          | 0          | 0                      | 0                          | 178/178        | 178/178       |
| actionpackversion         | 1             | 2        | 2       | 0          | 0          | 0                      | 0                          | 2/2            | 2/2           |
| actionview                | 24            | 134      | 63      | 34         | 2          | 21                     | 0                          | 3057/3057      | 3057/3061     |
| actioncable               | 4             | 18       | 5       | 0          | 0          | 0                      | 4                          | 496/496        | 497/497       |
| activejob                 | 5             | 17       | 12      | 0          | 0          | 0                      | 5                          | 369/369        | 368/370       |
| actionmailer              | 1             | 2        | 2       | 0          | 0          | 0                      | 0                          | 230/230        | 230/230       |
| activestorage             | 16            | 287      | 33      | 0          | 0          | 0                      | 22                         | 631/631        | 631/655       |
| actionmailbox             | 2             | 3        | 3       | 0          | 0          | 0                      | 2                          | 148/167        | 148/167       |
| actiontext                | 2             | 4        | 4       | 0          | 0          | 0                      | 0                          | 99/253         | 99/253        |
| trailties                 | 27            | 146      | 78      | 4          | 0          | 3                      | 7                          | 1661/1787      | 1662/1795     |
| **Total**                 | **220**       | **1672** | **809** | **182**    | **15**     | **102**                | **47**                     |                |               |

Re-run at `v8.0.5.1` the same command gives 159 DRIFT and 14 STALE where the
2026-10-13 measurement gave 141 and 12. Per package the counts agree except
actiondispatch (+1 DRIFT) and actionview (+17 DRIFT, +2 STALE): since
`25cc7a1876` the actionview pins grew from 441 to 1180 and the actiondispatch
pins from 1269 to 1393, so more of the bodies that changed are now pinned.
The five packages enrolled since then have no pins yet; their changing pairs
are in the unpinned column.

**Tests** (`extract-ruby-tests.rb` over each `testPath`):

| Package            | Tests 8.0.2 | Tests 8.0.5.2 | Added   | Removed | Changed in place | Moved |
| ------------------ | ----------- | ------------- | ------- | ------- | ---------------- | ----- |
| arel               | 730         | 730           | 0       | 0       | 0                | 0     |
| activerecord       | 9141        | 9183          | 43      | 1       | 10               | 0     |
| activemodel        | 1041        | 1043          | 2       | 0       | 0                | 0     |
| activesupport      | 3526        | 3550          | 27      | 3       | 9                | 0     |
| actiondispatch     | 1670        | 1687          | 20      | 3       | 2                | 0     |
| actioncontroller   | 1946        | 1962          | 18      | 2       | 10               | 0     |
| abstractcontroller | 52          | 52            | 0       | 0       | 0                | 0     |
| actionview         | 2579        | 2613          | 34      | 0       | 1                | 0     |
| actioncable        | 216         | 218           | 2       | 0       | 0                | 0     |
| activejob          | 416         | 421           | 5       | 0       | 1                | 0     |
| actionmailer       | 255         | 255           | 0       | 0       | 0                | 0     |
| activestorage      | 491         | 568           | 81      | 4       | 4                | 0     |
| actionmailbox      | 105         | 107           | 2       | 0       | 2                | 0     |
| actiontext         | 117         | 117           | 0       | 0       | 2                | 0     |
| trailties          | 2419        | 2440          | 22      | 1       | 5                | 0     |
| **Total**          | **24704**   | **24946**     | **256** | **14**  | **46**           | **0** |

"Changed in place" is a test at the same path whose extracted assertions or
gate differ. No test moves to a new describe path.

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

**Decision (owner, 2026-11-10, Open question 1): one flip PR, then a
burn-down on `main`, with a bump ledger.**

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
   against 8.0.2 cannot be pinned at the 8.0.5.2 digest by accident.
6. **Empty means deleted.** The RFC closes when the file has no rows and is
   removed. No trails release is tagged while a ledger has rows (§ 5).

The ledger is a new deviation register, and CLAUDE.md § "A documented deviation
is debt, not permission" applies to it in full: a row is "not yet re-verified",
never "accepted". What makes it different from a baseline row is that nobody
authors one. Its contents are a function of two upstream tags.

It needs the pin floor to be complete. 16 unpinned matched pairs change in
this bump and 2 of the 39 new gate rows sit on them; with no pin there is no
DRIFT row to seed from. Hence the entry criterion in § 4.

**How many rows.** The dry run at `v8.0.5.2` seeds **197 pair rows** (182
`drift`, 15 `removed`) against today's pins, and **37 test rows** (the
changed tests test-compare matches). 47 matched pairs change without a pin,
most of them in the five later-enrolled packages; retaking the floor first
pins them and they drift too, so the seed at the flip is about 244 pair rows.
The dry run after the floor is retaken gives the exact figure, and that figure
is what § Verification checks.

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

1. `ref: "v8.0.5.2"` in `vendor/sources.ts` and the re-locked
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
  of 8.0.2-verified and 8.0.5.2-verified bodies until the ledger is empty.
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
  8.0.2 until the flip. A body changed to match 8.0.5.2 gains call and
  argument rows against 8.0.2, and a method that exists only in the new tree
  is unreceipted extra surface in packages pinned at `novel === 0`. Only the
  tooling, the dry run and the story generation can be done ahead. Rejected
  for porting; adopted for sizing.
- **Flip one package at a time.** A `ref` per package would cut the blast
  radius, but two active Rails versions at once doubles the citation and
  registry rules RFC 0159 just simplified. Rejected.

#### Parallel work during the burn-down

- An agent on an unrelated story sees a green `main` and unchanged gates.
- An agent touching a ledgered method reads `vendor/rails/v8.0.5.2/`, the
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
   source** (898 on 2026-10-13, before the five later-enrolled packages were
   counted). RFC 0159's `pin-the-body-hash-floor-before-the-first-bump`
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
   owner on 2026-10-13: RFC 0175 finishes first. **RFC 0175 is closed** (141
   stories done or closed, read from the tasks DB on 2026-11-10);
   `entry-check-data-layer-parity-is-closed-on-8-0-2` confirms the 100% figures
   on current `main`. The reason is the tag: `rails-8.0.2` marks a complete
   data layer on the tree it was ported against.

**Need not be true:**

- actionpack, actionview, actioncable, activejob, actionmailer,
  activestorage, actionmailbox, actiontext or trailties parity. The flip moves their
  denominators and their ledger rows; it does not need them finished.
- Pins on the non-Rails gems (thor has 367 unpinned). Each gem's own bump
  retakes its own floor.
- RFC 0100, any published package, or a version-scheme ruling (§ 6).
- An empty `call-mismatches-exclude/` or zero receipts. Existing debt on
  units upstream did not change is unaffected by the bump.

### 5. Branching and tagging

The tag rule below is the plan. The branch policy (Open question 2) is
deferred by the owner (2026-11-10) to `tag-the-last-rails-8-0-2-commit`, which
asks it before tagging; until then the default is the recommendation, tags
only. The flip does not depend on the answer.

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
be answered to flip to `v8.0.5.2`. The analysis is recorded here so it is not
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
  a second problem: `8.0.5.2` itself has four segments and is not a valid npm
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
"ref": "v8.0.5.2", "sha": "235c597b100…" }`, written from
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
Both 2026-10-13 measurements (`v8.0.5.1` in § 2, `v8.1.4` in § 8) are
backfilled as the first reports, marked as transcribed by hand. The
retrospective reads its figures back out of these tables, which is their
first use.

#### The runbook

As it will be written into vendor/README.md § "Upgrading a source (bumping
`ref`)", whose seven existing steps (RFC 0159) it keeps and wraps. Every
command below exists today except the two marked _new_:

1. **Resolve the target.** `git ls-remote --tags <url> 'v<major>.<minor>*'`;
   record the tag and its `^{}` commit SHA. Read the tag's `Gemfile.lock` and
   every `*.gemspec` diff against `vendor/sources.lock.json`, apply the
   dependent-source rule of § 1, and note any gemspec floor that forces a gem.
   Check the line is still inside Rails' maintenance window.
2. **Fetch beside and dry-run** (existing step 1 and 2).
   `pnpm vendor:fetch --source rails --ref <tag>` clones
   `vendor/rails/<tag>/` without touching the lockfile; then _new_
   `pnpm parity:bump:dry-run --source rails --ref <tag>`. Put its tables in the
   upgrade RFC and commit its report.
3. **Entry.** Check § 4. Retake the pin floor with
   `pnpm parity:api:pins:all` on the old ref, as late as possible.
4. **Flip PR** (existing steps 3 to 5): `ref` in `vendor/sources.ts`;
   `pnpm vendor:fetch --source rails`, which adopts the candidate and re-locks
   `vendor/sources.lock.json`; the report and the seeded ledger;
   `pnpm vendor:recite --check` saved, then `pnpm vendor:recite` in its own
   commit; `pnpm parity:api:inlined:fix`; stale deletions outside the ledger
   with the gates' `:tighten` commands; regenerated artifacts; version
   constants; `mirrors` fields.
5. **Tag** the flip commit's parent `rails-<old>`.
6. **Generate** the burn-down stories (_new_ generator) and write their ids
   into the ledger rows.
7. **Burn down** (existing step 6): re-verify each ledgered body against the
   new tree, `pnpm tsx scripts/api-compare/body-pins.ts --pin <ruby-file>`,
   which deletes the row; `pnpm parity:api:pins` shows what is left. Port
   what is new, delete what is gone. Re-read each recited citation.
8. **Close**: ledger empty and deleted, `pnpm parity:api:pins` at 0 DRIFT and
   0 STALE, `pnpm vendor:fetch --prune --source rails` (existing step 7),
   retrospective, RFC closed.
9. **Dependent sources** by the same steps, gemspec-forced ones first, then
   smallest first.

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

### 8. The next bump: 8.1

Not planned here. Recorded so the 8.1 RFC starts from numbers, and so the
tooling is built for the larger case. The right-hand column is `v8.0.2` →
`v8.1.4` (`c3466ea00d7121798e3aa3144ffdf7174b81d8cb`, tagged 2026-09-24, the
highest `v8.1*` tag then; no `v8.2*` tag exists), measured 2026-10-13. Since
then `v8.1.4.1` (`3f290b759c8e2ffe7c257951b1255740751355e4`, 2026-11-04, 21
GHSAs) is the highest 8.1 tag. All of this is superseded by a dry run from the
`v8.0.5.2` base when this RFC closes.

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
   then in parallel `bump-ledger-scopes-the-call-ratchets-off-drifted-pairs`,
   `bump-ledger-scopes-the-signature-and-surface-ratchets-off-drifted-pairs`,
   `bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests` and
   `bump-history-is-recorded-in-the-stats-db`.
   `record-the-mirrored-ref-in-each-package` and
   `entry-check-data-layer-parity-is-closed-on-8-0-2` are independent.
2. **Entry.** `retake-the-body-pin-floor-at-the-last-8-0-2-commit`, as late
   as possible.
3. **Flip.** `flip-the-rails-ref-to-v8-0-5-1` (the slug predates the retarget;
   it flips to `v8.0.5.2`), then `tag-the-last-rails-8-0-2-commit` on its
   parent.
4. **Post-flip, in parallel.** `generate-the-rails-8-0-5-1-burn-down-stories`,
   `reread-the-recited-rails-citations-against-v8-0-5-1`,
   `mirror-the-v8-0-5-2-activerecord-test-schema-models-and-fixtures`,
   the gemspec-forced chain `bump-nokogiri-to-v1-19-7` →
   `bump-loofah-to-v2-25-3` → `bump-rails-html-sanitizer-to-v1-7-2`, and
   `size-and-sequence-the-dependent-source-bumps` for every other mover. Then
   `document-the-minor-bump-runbook`, which waits for the generator. The
   burn-down itself runs in the generated RFC.
5. **Close.** `retire-the-rails-ledger-and-prune-v8-0-2`, then
   `write-the-retrospective-and-scope-the-rails-8-1-upgrade`.

Story clusters are the phase names: `tooling`, `entry`, `flip`, `post-flip`
and `close`. Story slugs that say `8-0-5-1` were kept on the retarget because
a slug is a story's database id; their titles and bodies say `v8.0.5.2`.

## Verification

- Before the flip: the dry run on `main` reports **0** red gates on units
  outside the ledger seed, and **0** unpinned matched bodies in the Rails
  packages (898 on 2026-10-13, before five packages were enrolled).
- The flip PR's CI is green, and so is the first unrelated PR merged after it.
- At the flip commit the Rails ledger holds exactly the rows the dry run
  computes after the floor is retaken at `v8.0.5.2` (at least 169 pair
  rows, as measured at `v8.0.5.1`, plus the 8.0.5.2 delta and the five
  later-enrolled packages; the dry-run report states the figure) and at most
  the number of matched tests that change in place. It only shrinks from there. `git log -p` on the file shows no added
  row outside a lockfile `ref` change.
- At close: the ledger file is gone, `pnpm parity:api:pins` reports 0 DRIFT
  and 0 STALE with `rails` at `v8.0.5.2`, `git grep 'vendor/rails/v8\.0\.2'`
  is empty, and no call, argument, parameter, block, arm, extra-surface or
  assertion baseline or mark is wider than at the `rails-8.0.2` tag.
- The stats DB answers, for this bump: rows predicted, rows at the flip, and
  days from flip to empty ledger.
- `vendor/README.md` holds a runbook that names every command used, and an
  8.1 upgrade RFC is open with a dry run from the `v8.0.5.2` base.

## Open questions

<!-- Every question here must be resolved or explicitly deferred (to a named
     follow-up RFC/story) before this RFC moves to `status: active`. -->

None open. Every question below is resolved or deferred to a named story.

Resolved or deferred:

- **Is the bump ledger acceptable?** (Open question 1.) Resolved 2026-11-10
  by the owner: yes, as designed in § 3. It suspends the per-unit ratchets on
  the seeded pairs and changed tests for the length of the burn-down; its
  rows are generated from two upstream tags and only shrink.
- **Branch policy.** (Open question 2.) Deferred 2026-11-10 by the owner to
  `tag-the-last-rails-8-0-2-commit`, which asks it before placing the tag.
  Until answered the default is the recommendation (tags only; a
  `<major>-<minor>-stable` branch cut from the tag when a published line
  needs a fix). Nothing before the tag depends on it.
- **Does the ledger cover gates the dry run could not exercise?** (Open
  question 3.) Resolved 2026-11-10 by
  `bump-dry-run-runs-the-gates-against-a-candidate-ref`: it exercises the
  inlined-from citation spans (by re-citing and restoring them) and lists the
  rest under "not exercised" with the upstream count that predicts each
  (§ Motivation). Those gates stay residual risk for the flip PR.
- **Which 8.0 release?** Resolved 2026-11-10: `v8.0.5.2`, the highest 8.0
  tag, and the last expected (8.0.x security support ended 2026-11-07, § 1).

- **Target.** Resolved 2026-10-13 by the owner: the last 8.0 release first,
  as this RFC (then `v8.0.5.1`); 8.1 as a follow-up.
- **Is closing RFC 0175 an entry criterion?** Resolved 2026-10-13 by the
  owner: yes. § 4, criterion 4.
- **Version scheme, and release timing.** Deferred to the 8.1 upgrade RFC
  opened by `write-the-retrospective-and-scope-the-rails-8-1-upgrade`. § 6.
- **Do dependent gems stop at the 8.0.5.2 lock's versions?** Deferred to
  `size-and-sequence-the-dependent-source-bumps`, which asks it with the dry
  runs in hand. It does not apply to the gemspec-forced chain (nokogiri,
  loofah, rails-html-sanitizer), which moves to the 8.0.5.2 lock's versions.

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
- 2026-11-10: retargeted to `v8.0.5.2` (commit `235c597b`, released
  2026-11-04, 19 GHSAs over `v8.0.5.1`); 8.0.x security support ended
  2026-11-07, so it is the line's last release. § 1 gains the 8.0.5.1 →
  8.0.5.2 delta, the maintenance-window note, the five Rails packages enrolled
  since 2026-10-13, the `rails-html-sanitizer >= 1.7.2` gemspec floor and the
  re-read dependent-source table; the 2026-10-13 measurements are kept as a
  floor, labelled `v8.0.5.1`, for the dry run to replace. The runbook names
  every command. Owner rulings: the ledger is accepted (Open question 1); the
  branch policy is deferred to the tag story (2). Stories added for the
  sanitizer chain and the activerecord test schema; RFC moved to `active`.
  The directory slug and the `8-0-5-1` story slugs are kept, since they are
  database ids.
- 2026-11-10: § Motivation's gate and attribution tables, § 2's tables and
  § 3's seed estimate replaced with `pnpm parity:bump:dry-run --source rails
--ref v8.0.5.2` figures over all sixteen Rails packages (197 pair rows, 37
  test rows); the `v8.0.5.1` re-run's difference from 2026-10-13 explained by
  pins added since. Open question 3 resolved.
