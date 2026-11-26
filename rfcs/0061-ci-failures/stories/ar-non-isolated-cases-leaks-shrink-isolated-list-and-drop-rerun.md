---
title: "AR non-isolated cases: fix the state leaks, shrink AR_ISOLATED_CASES, drop the isolated re-run"
status: ready
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10765 runs `packages/activerecord/test/cases/**` in non-isolated vitest
forks (`AR_SPLIT=cases`, `vitest.config.ts`; `poolOptions.forks.isolate` is
false for that step). Two mechanisms keep it green, and both are debt:

- `AR_ISOLATED_CASES` in `vitest.config.ts` lists 61 case files, found by
  trial, that are excluded from the non-isolated step and run isolated with
  the `rest` step. Two of them call `vi.resetModules`
  (`connection-adapters/registration.test.ts`,
  `support/drop-all-tables.trails.test.ts`); the other 59 were moved there
  because they failed, or made a later file fail, in a shared fork.
- `scripts/ci/ar-non-isolated-cases.sh` re-runs every file that fails the
  non-isolated pass in isolated forks and takes that result. In the three CI
  runs measured on the PR it re-ran 14, 2 and 2 files on SQLite. The script
  prints the list under "Re-running N file(s) in isolated forks:".

The re-run hides two things. A test that leaks state into a later file is
never named: only its victim is re-run. And a leak can make a test PASS in the
shared fork that would fail alone; that file is never re-run, so the false
pass ships.

What is known about the leaks: in a shared fork vitest re-evaluates the
`setupFiles` for each test file but shares every module they import, so module
state in `lib/**` and in `test/support/**` persists across files.
`test/support/test-setup-dy.ts` resets tables and `FixtureSet`'s cache on
re-entry, and `test/cases/helper.ts` and `activesupport/lib/testing/autorun.ts`
keep their registries on `globalThis`. Nothing resets class-level state a test
file writes on a canonical model (callbacks, validators, `tableName`,
`defaultScopes`, connection handler swaps), and a `vi.resetModules` file
leaves the next file with fresh modules and a stale `globalThis` boot record
("resetTestTables ran before recordBootLaidTables").

## Acceptance criteria

- Each file in `AR_ISOLATED_CASES` other than the two `vi.resetModules` files
  is either fixed so it restores what it changes (Rails' own tests do this in
  `teardown`; read the Rails test at
  `vendor/rails/v8.0.5.2/activerecord/test/cases/` for the file first) and
  removed from the list, or split into its own story naming the leak.
- The files the script re-ran on `main` over a week of runs are collected from
  the job logs, and each leaker (not the victim) is identified and fixed.
- Once the re-run count on `main` is zero across the three adapter lanes for a
  week, the re-run in `scripts/ci/ar-non-isolated-cases.sh` is removed, so a
  non-isolated failure is a red.
- A scheduled or labelled lane runs the same cases isolated, so a test that
  passes only because of a leak is caught.
