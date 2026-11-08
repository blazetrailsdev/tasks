---
rfc: "0225-package-pages-data-completeness"
title: "Every package with an upstream counterpart shows api and tests data on trailmap's Packages page"
status: active
created: 2026-11-07
updated: 2026-11-07
owner: "@deanmarano"
packages:
  - tse-compiler
  - image-processing
  - html-sanitizer
  - nokogiri
  - actionview
  - tzinfo
  - scripts
clusters:
  - test-enrollment
  - pairing
  - trailmap-checks
related-rfcs:
  - 0136-trailmap
  - 0222-trailmap-package-pages
  - 0199-nokogiri-html-sanitizer-parity
  - 0223-package-layout-mirrors-a-rails-gem
priority: 2
---

# RFC 0225 — Package pages data completeness

## Summary

trailmap's `/packages` page (snapshot 2026-11-07) shows "no data" or
"trails-only" for packages that have a vendored upstream gem. This RFC makes
the data complete: every package with a counterpart gets an api tile and a
tests tile, or a recorded reason for not having one. Raising the percentages
is out of scope (see Non-goals).

## Motivation

Data path: trails CI writes `scripts/parity/output/package-summary.json`
(`scripts/parity/package-summary.ts`), plus api:compare and test:compare step
output, into the `parity-outputs-<sha>` artifact. trailmap's stats sync
(`lib/stats-sync/package-summary.ts`) loads it into `package_meta`,
`api_compare_stats` and `test_compare_stats`.
`app/controllers/packages-controller.ts` sums the rows over
`PackageMeta#compareKeys()`.

Why each gap in the snapshot happened, as of 2026-11-07:

| Gap                                                                                                                                                              | Cause                                                                                                                            | Status                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| actionpack api and tests "no data"                                                                                                                               | `package_meta.compare_keys` NULL; rows sit under `actiondispatch`, `actioncontroller`, `abstractcontroller`, `actionpackversion` | fixed by trails#9825 and trailmap#127; verified by `packages-actionpack-rolls-up-compare-keys` (0136) after the next sync                              |
| api "no data" for did-you-mean, et-orbi, mini-magick, mini-mime, net-smtp, rack-session, rack-test, solid-cable, solid-queue                                     | the sync parser matched the package with `(\w+)`, so hyphenated keys were dropped                                                | fixed by trailmap#127; solid-\* verified by `solid-queue-solid-cable-compare-data` (0136); the rest by `packages-page-flags-missing-compare-data` here |
| image-processing, html-sanitizer, date, nokogiri listed trails-only                                                                                              | `railsCounterpartOf` skipped `compareApi: false` entries                                                                         | fixed by trails#9825 (api enrolled for all of them); the page shows it after the next sync. The latest synced commit (pr 9819) predates it             |
| empty sections for packages with no counterpart look like broken data                                                                                            | the page rendered NULL `rails_counterpart` as blank tiles                                                                        | `packages-page-names-trails-only-packages` (0136, in progress)                                                                                         |
| tests tile missing for image-processing, html-sanitizer (rails-html-sanitizer, loofah, crass), nokogiri (nokogiri, racc), actionview's rails-dom-testing, tzinfo | `compareTests: false` in `vendor/sources.ts`, with no reason recorded                                                            | **this RFC**                                                                                                                                           |
| tse-compiler listed trails-only                                                                                                                                  | erubi (Rails 8.0.2 locks 1.13.1, `vendor/rails/v8.0.2/Gemfile.lock:201`) is not vendored                                         | **this RFC**                                                                                                                                           |

The last sync to run was 2026-11-07 08:00. trails#9825 merged at 08:29, so
the page will not reflect it until the 2026-11-08 sync.

## Design

1. **A recorded reason for every missing tile.** `compareTests: false` must
   carry `testsExcludedReason`, as `compareApi: false` already carries
   `apiExcludedReason` (`validateSources`). The package summary appends it to
   the package's description. A missing tile then always says why.
2. **Enroll test-compare for every vendored gem with a TS port.** One story
   per gem family, following mini_mime's entry (`vendor/sources.ts:1009-1013`).
   Each story sets `testPath`, flips `compareTests`, asserts the key in
   `vendor/sources.test.ts`, and records each Rails test file with no TS
   counterpart as a row in `scripts/parity/unported-files/<key>.ts`. Enrollment ports no tests: a low
   percentage is fine, but a missing tile is not.
3. **Pair tse-compiler with erubi.** Vendor erubi v1.13.1 with
   `portedBy: "tse-compiler"` and enroll api and tests. tse-compiler then drops
   out of `package-summary.test.ts`'s no-counterpart list.
4. **trailmap flags missing data.** After each sync, list every
   `package_meta` row with a non-NULL `rails_counterpart` that has no api or
   tests row under its compare keys and no exclusion reason. Mail it the same
   way a failed sync is mailed, so a missing tile shows up the day it appears.

## Non-goals

- **Raising api or tests percentages.** Convergence is tracked by the
  per-package RFCs (0212/0142 trailties, 0216 actionmailbox, 0171 thor,
  0196 solid stack, 0195 msgpack, 0154 ruby-compat) and the surfaced-deviation
  buckets. Ruled by the repo owner on 2026-11-07.
- **ruby-compat counterpart.** It stays in `TS_ONLY_PACKAGES`, since it is a
  port of Ruby itself. Its tests tile against MRI stays as it is.
- **Splitting mysql2/pg/sqlite3 out of activerecord's tile.** They stay
  summed under activerecord's compare keys.
- **solid-cache.** `vendor/sources.ts:845-853` keeps `compareApi: false` and
  `compareTests: false` because no `packages/solid-cache` exists yet. 0196's
  `solid-cache-package-skeleton` creates the package and enrolls it. Its
  `testsExcludedReason` (story 1) names that story.
- **tzinfo's api 0/371.** That is a file-layout problem, owned by
  `tzinfo-port-mirrors-lib-tzinfo-files` (0223).

## Alternatives considered

- **Hide the tile when a comparison is disabled.** Rejected: it hides the gap
  this RFC exists to close.
- **Enroll a gem's tests only once its tests are ported.** Rejected: the tile
  should exist from enrollment, and `unported-files` rows already record what
  is not ported.

## Rollout

1. `sources-tests-excluded-reason`. After this lands, every disabled tile
   carries a reason that names the story enrolling it.
2. Enrollment, in any order: `image-processing-tests-enroll-in-parity-test`,
   `html-sanitizer-gems-tests-enroll-in-parity-test`,
   `rails-dom-testing-tests-enroll-in-parity-test`,
   `nokogiri-tests-enroll-in-parity-test`, `racc-tests-enroll-in-parity-test`,
   `vendor-erubi-pair-tse-compiler`.
3. `packages-page-flags-missing-compare-data` (trailmap repo).
4. `tzinfo-tests-enroll-in-parity-test` waits on
   `tzinfo-port-mirrors-lib-tzinfo-files` (0223), which has no date. Until
   then tzinfo meets the bar through its `testsExcludedReason`, which names
   this story. The RFC closes when this story lands, not before.

## Verification

- After phases 1–3: the check from `packages-page-flags-missing-compare-data`
  reports zero packages, because tzinfo's missing tests tile has a recorded
  reason.
- On the first sync after trails#9825 (expected 2026-11-08), that check
  reports none of did-you-mean, et-orbi, mini-magick, mini-mime, net-smtp,
  rack-session, rack-test, image-processing, html-sanitizer, date or nokogiri.
  This confirms the fixes that already shipped. The check's output is recorded
  in that story's PR.
- After phase 4: `tzinfo` has a `test_compare_stats` row. The only packages
  with a NULL counterpart are `activerecord-cli`, `ruby-compat`, `trails-tsc`,
  `vitest-matchers` and `website`.

## Open questions

None. Scope was settled with the repo owner on 2026-11-07: data only; vendor
erubi; enroll the vendored-but-skipped gems; ruby-compat stays trails-only;
the DB driver gems are out of scope. solid-cache is deferred to 0196 (see
Non-goals).

## Changelog

- 2026-11-07: initial RFC
