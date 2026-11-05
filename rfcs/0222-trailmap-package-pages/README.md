---
rfc: "0222-trailmap-package-pages"
title: "trailmap: per-package pages for newcomers who know Rails but not trails"
status: active
created: 2026-11-05
updated: 2026-11-05
owner: "@deanmarano"
packages:
  - actionpack
  - actionview
  - activerecord
  - scripts
clusters:
  - package-summary-data
  - package-pages
related-rfcs:
  - "0136-trailmap"
priority: 4
---

# RFC 0222 — trailmap: per-package pages for newcomers who know Rails but not trails

## Summary

Give every trails package a page in trailmap that answers the four questions a
Rails developer new to trails asks first: what is this package the port of,
how close is it, where is it different on purpose, and what can I pick up.
Five routes — `/packages`, `/packages/:name`, `/packages/:name/files`,
`/packages/:name/deviations`, `/packages/:name/work` — read from two sources
trailmap already has: the stats database (parity numbers, trended per merge
commit) and the tasks database (stories). The one new data feed is a trails
script that summarises each package's receipts, marks and parked tests, which
the stats-sync job stores beside the existing compare tables.

## Motivation

A newcomer today has to assemble a package's picture from six places:
`pnpm parity:api` output, the `call-mismatches-exclude` JSONs, a grep for
`@noRailsEquivalent`, the root and package `CLAUDE.md`, `pnpm tasks list | grep`,
and trailmap's `/graphs/parity`. None of them is per-package in one view, and
the receipts that explain "this works differently than you'd expect" are only
reachable by grep.

Measured on 2026-11-05 (trailmap `317a0c7`, trails `827225005b`, shared
`tasks.db`):

- **stats.db has per-package rows, no per-file rows.** `api_compare_stats`,
  `api_calls_stats`, `api_call_args_stats`, `api_compare_privates_stats` and
  `test_compare_stats` each hold `(merge_commit_sha, pr_number, package,
matched, total, percent, …)` — 76,276 `api_compare_stats` rows over 33
  packages (`trailmap/db/statsSync_schema.ts:17-60,212-224`). Nothing stores a
  Rails file, a TS path or a method list. There are no tables for
  `parity:api:params`, `parity:api:predicates`, tag counts, marks, or
  `PERMANENT-SKIP` lines.
- **The rows come from CI logs.** `lib/stats-sync/sync.ts:865-911` splits a job
  log into compare steps (`classify-compare-step.ts:14-34`) and parses the
  printed per-package tables; `compare_logs.step_name` holds only
  `api_compare`, `api_calls`, `api_compare_privates`, `test_compare`.
- **The per-file data already exists, but is not kept.** `api-compare`
  writes `output/api-comparison*.json` with `results[].files[]`
  (`trails/scripts/api-compare/compare.ts:26`), and main's
  `Rails API/Test Comparison` job uploads an artifact
  `parity-outputs-<sha>` with 90-day retention
  (`trails/.github/workflows/ci.yml:2458-2471`) that today carries only
  `convention-comparison.json` (`scripts/parity/main-artifact.ts:1-25`).
- **The story `packages` field is not reliable on its own.** Of open stories
  (ready, draft, blocked): 609 of 1,682 carry their own `packages`
  (`story_packages`). Of the 1,073 without, 949 sit under an RFC listing more
  than three packages — `0023-surfaced-deviations` lists 16, `0136-trailmap`
  lists 7 — so inheriting the RFC's list attributes a story to packages it does
  not touch. `story_paths` rescues most of them: 791 of those 949 name a
  `packages/<pkg>/…` path. About 160 open stories have no usable attribution.

## Design

### Data: a per-package summary, carried by the parity artifact

**trails** gains `scripts/parity/package-summary.ts` (`pnpm parity:packages`),
which writes `scripts/parity/output/package-summary.json`. Its `packages[]`
enumerates `packages/*/package.json` (46 on 2026-11-05) — that list, not
stats.db, is what "every package" means on every page.

- **Per package (`packages[]`):** `railsCounterpart` (the gem directory
  api-compare pairs the package with, or `null`), `description` from
  `package.json`, `claudeMd` (the path of `packages/<pkg>/CLAUDE.md`, or
  `null`); a count of each JSDoc tag — `@noRailsEquivalent` split `PERMANENT`
  / `CONVERGEABLE`, `@missingRailsCall`, `@missingRailsArgs`,
  `@missingRailsName`, `@inventedArm`, `@perf`, `@inlinedFrom`, `@internal`;
  mark and baseline counts — `call-mismatches-exclude` rows, call-args
  baseline rows, `extra-surface-mark.json` novel / total,
  `module-count-mark.json`, the `parity:api:sends` count; params and
  predicates as `matched` / `total` (name-matched pairs compared, less the
  pairs in `output/param-name-mismatches.json` and the predicate-kind
  measurement), the same shape as the other gates; and `PERMANENT-SKIP:`
  tests grouped by the `CLAUDE.md` section they cite.
- **Per tag site (`tagSites[]`):** `{package, tag, receipt, file, line,
declaration, citedSection}`, so the deviations page drills to `file:line`.
- **Per `CLAUDE.md` section (`claudeSections[]`):** `{file, heading, anchor,
lede}` for every `##` / `###` heading of the root and package `CLAUDE.md`
  files, `lede` its first paragraph. A `PERMANENT-SKIP` line or receipt that
  cites a section resolves to its `anchor` here, so trailmap renders the text
  without reading a trails checkout.
- **Per Rails file (`files[]`):** `{package, rubyFile, tsFile|null,
methodsMatched, methodsMissing, testsMatched, testsTotal}`, joined from the
  api-compare and test-compare outputs the job already produced.

The `Stage parity outputs` step copies the JSON into `parity-outputs-<sha>`.
No new log format is parsed.

**trailmap's stats-sync** downloads the artifact for each merged commit it
syncs and writes, keyed by `merge_commit_sha`, `pr_number`:

| Table                | Grain                   | Columns beyond the key                                                          |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `package_meta`       | package                 | `rails_counterpart`, `description`, `claude_md`                                 |
| `package_tag_stats`  | package × tag × receipt | `count`                                                                         |
| `package_mark_stats` | package × mark          | `value`, plus `matched` / `total` for the params and predicates gates           |
| `package_file_stats` | package × Rails file    | `ts_file`, `methods_matched`, `methods_missing`, `tests_matched`, `tests_total` |
| `package_tag_sites`  | site (latest only)      | `package`, `tag`, `receipt`, `file`, `line`, `declaration`, `cited_anchor`      |
| `package_skip_tests` | test (latest only)      | `package`, `file`, `test_name`, `cited_anchor`                                  |
| `claude_md_sections` | section (latest only)   | `file`, `heading`, `anchor`, `lede`                                             |

Trends come from the key, as they do for the compare tables. trailmap's
`Stats` connection stays read-only (`app/models/stats.ts:1-33`); only the sync
writes. A package with no rows in a compare table (13 of 46 today) shows "no
data" on that gate's tile, never 0.

### Story → package attribution

A `Story.touchingPackage(name)` scope, in this order:

1. the story's own `story_packages` rows;
2. otherwise `story_paths` rows under `packages/<name>/`;
3. otherwise the RFC's `packages`, only when that list has exactly one entry.

A story matching none is unattributed and listed nowhere. A one-off backfill
gives the ~160 remaining open stories an explicit `packages` list. To keep it
at 0, `tasks validate` warns on a new or modified story none of the three
rules attribute, and the index page shows the open unattributed count.

A package's **surfaced deviations** are the open stories of its bucket RFC,
`NNNN-<pkg>-surfaced-deviations` where one exists (0124 arel, 0134
activemodel, 0141 actionpack, 0142 trailties, 0154 ruby-compat, 0189
activerecord, 0214 activejob), plus the open stories of the retired catch-all
`0023-surfaced-deviations` that `Story.touchingPackage` attributes to it.

### Pages

All five reuse the layouts and partials of `rfc-pages`, `story-pages` and
`parity-graphs` (`config/routes.ts:115-123`).

- **`/packages`** — one row per package, grouped "Rails counterparts"
  (activerecord, actionpack, …) and "trails-only" (ruby-compat,
  vitest-matchers, image-processing, …) by the summary's counterpart field;
  each row shows parity tiles (api, tests) and open-story count.
- **`/packages/:name`** — counterpart and purpose; a stat tile with sparkline
  for every gate (api, calls, call args, params, predicates, tests,
  assertions, privates); story counts by status and the RFCs touching the
  package; a "Start here" box with the top three ready stories ranked by
  `app/models/concerns/ranking.ts`, a link to `packages/<name>/CLAUDE.md` when
  it exists (17 of 46 packages have one), and the Rails file with the most
  missing methods.
- **`/packages/:name/files`** — the Rails `.rb` file map: TS path or
  "unported", methods matched / missing, test match %, open stories per file
  (by `story_paths`); grouped by directory, sortable.
- **`/packages/:name/deviations`** — tag counts drillable to `file:line`;
  mark and baseline counts with trend; `PERMANENT-SKIP` tests grouped by
  cited section; open surfaced-deviations stories (per the rule above); and the ratified
  sections of the package and root `CLAUDE.md` that the package's receipts
  cite, as "works differently than you'd expect" — heading, lede and a link,
  from `claude_md_sections`.
- **`/packages/:name/work`** — attributed stories grouped by RFC, ready
  first; a done-over-time burndown from `events`.

## Non-goals

- **Writing to stats.db from trailmap pages:** the `Stats` connection is
  read-only by driver flag, and stays so.
- **Replacing `/graphs/parity`:** the cross-package graph stays; the package
  pages link into it.
- **Backfilling per-file history before the first artifact:** the artifact is
  90-day retention and the per-file JSON is new; trends start at first sync.
- **Editing stories from these pages:** the lifecycle buttons stay on
  `/story/:id`.

## Alternatives considered

- **Parse the new numbers out of CI logs**, as stats-sync does today. Rejected:
  per-file and per-site rows run to thousands of lines per commit, and a log
  table format is the fragile surface `classify-compare-step.ts` already
  documents.
- **trailmap computes the summary itself from a trails checkout.** Rejected:
  trailmap would grow a second implementation of the receipt grammar the trails
  lint rules own, and would have no history.
- **Inherit the RFC's `packages` for every story.** Rejected by measurement:
  949 open stories would be attributed to four or more packages each.

## Rollout

1. Data — `emit-package-summary-json`, then `emit-package-file-rows`, then
   `stats-sync-stores-package-summary-tables`; in parallel
   `story-touching-package-scope`, then
   `backfill-story-packages-on-open-stories` and
   `validate-warns-on-unattributed-story`.
2. Pages — `packages-index-page`, then `package-overview-page`; in parallel
   with the overview, `package-work-page`, `package-files-page` and
   `package-deviations-page`, which need only the data stories.

## Verification

- `/packages` lists every package in the latest summary's `packages[]` (46
  on 2026-11-05), each in exactly one group.
- For every package with a row, the overview's api and tests tiles equal the
  latest `api_compare_stats` / `test_compare_stats` row for it; each of the
  packages without one (13 today) shows "no data".
- The deviations page's `@noRailsEquivalent` count for activerecord equals
  `grep -ro '@noRailsEquivalent' packages/activerecord/src | wc -l` on the
  synced commit, less any tag the lint rules' JSDoc parser rejects.
- The unattributed open-story count shown on `/packages` is 0 when the
  backfill merges, and `tasks validate` warns on any new story that would
  raise it.

## Open questions

1. **Per-file rows per commit, or latest only?** ~46 packages × a few hundred
   Rails files each per merge is ~10k rows/commit. Recommendation: store per
   commit (trends on the files page), and revisit if `stats.db` growth hurts.
2. **Artifact expiry for missed syncs.** A sync more than 90 days behind finds
   no artifact. Recommendation: record the miss in `sync_log` and skip; do not
   recompute.

## Changelog

- 2026-11-05: initial RFC
- 2026-11-05: review — metadata and `CLAUDE.md` section tables, params and
  predicates as matched / total, surfaced-deviations rule, validate warning,
  summary script split, detail pages off the data stories
