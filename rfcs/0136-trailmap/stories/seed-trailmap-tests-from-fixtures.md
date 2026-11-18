---
title: "Seed trailmap's controller and model tests from test/fixtures instead of per-file creates"
status: claimed
updated: 2026-11-18
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["test-trailmap-through-a-test-helper-fixtures-and-app-routes"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-11-18T00:36:22Z"
assignee: "seed-trailmap-tests-from-fixtures"
blocked-by: null
closed-reason: null
---

## Context

Split from `test-trailmap-through-a-test-helper-fixtures-and-app-routes`, which
measured 43 harness files and 284 `.create(` calls and predicted a split. Its PR
landed the harness: `test/test-helper.ts` boots the app in `test` through
`trails/test-help`, `test/global-setup.ts` maintains the schema once per run,
each vitest file gets its own `storage/test.sqlite3-<n>` from
`TestDatabases.createAndLoadSchema`, and every test runs inside test-help's
transactional fixtures. `test/routes.test.ts` asserts with `assertRecognizes`.

What it did not do is the data. The controller and model tests still seed the
rows they share in each file's `beforeAll`/`beforeEach` with `Model.create(...)`
(`test/controllers/rfc-pages-controller.test.ts`, `backlog-page.test.ts`,
`story-pages-controller.test.ts`, `searches-controller.test.ts`,
`stories-controller.test.ts`, and others), and `test/fixtures/` holds no
`<table>` files. Rails' shape is `fixtures :all` over `test/fixtures/*.yml`,
which `trails new`'s generated `test/test-helper.ts` declares with
`TestCase.fixtures(":all")`.

The harness is already in place for it: test-help adds `test/fixtures/` to
`ActiveSupport::TestCase.fixturePaths`, and fixture loading runs in every
test's setup.

## Acceptance criteria

- The RFCs two or more test files seed by hand become `test/fixtures/rfcs.yml`,
  which `test/test-helper.ts`'s `TestCase.fixtures(":all")` already loads.
  `stories`, `story_deps`, `story_paths` and `events` move to
  `seed-story-tables-from-fixtures`: `fixtures :all` puts every row in every
  file, so their shared rows change counts other files assert on, which the
  last criterion here rules out.
- `test/test-helper.ts` rebuilds `storage/test.sqlite3-<n>` once per worker,
  as Rails' `parallelize_setup` does, instead of once per file: that per-file
  rebuild exists only because rows were seeded outside the test transaction.
- The files that used them read the fixture rows instead of re-creating them.
  A test that needs a one-off row still creates it inline. Reading them through
  the fixture accessors (`testCase.rfcs("trailmap")`) waits on
  `autorun-test-context-augments-vitest-runner`: the accessor works at runtime,
  but `({ testCase })` does not typecheck in an application.
- The files that opt out of transactional tests
  (`TestCase.useTransactionalTests = false`: the stats-sync files,
  `hub-database`, `parity-refresh`) keep working, and none of them loads the
  task-domain fixtures into a database it does not own.
- `pnpm test` passes with no assertion changes beyond the data plumbing, both
  without Postgres and with CI's `HUB_DATABASE_URL`/`HUB_TEST_DATABASE_URL`.
