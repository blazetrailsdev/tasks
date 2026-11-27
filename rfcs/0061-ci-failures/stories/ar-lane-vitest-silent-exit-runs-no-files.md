---
title: "ar-lane-vitest-silent-exit-runs-no-files"
status: draft
updated: 2026-11-27
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On green main run 45938180610 (2026-11-27), the AR adapter lanes' main step (`pnpm vitest run packages/activerecord/ packages/solid-queue/ … --project '!system' --shard=i/3`) printed `RUN v3.2.4` and then nothing: no file lines and no `Test Files` summary. The step still passed. That happened on SQLite (2), SQLite (3), PostgreSQL (2) and MariaDB (2). The other legs' summaries show only 8–32 files, where about 77 a leg are expected (231 files over 3 legs), and those numbers may come from later steps.

It reproduces locally: `pnpm vitest run packages/solid-cache/ --project '!system'` prints only `RUN` and exits 0. Running a single file under the same filter does run the tests.

The cause looks like the event loop draining while vitest awaits a promise that no live handle will settle, so node exits 0 without error. trails#10835's queue driver (`scripts/ci/ar-shard-queue.mts`) hit the same drain as exit 13 ("unsettled top-level await") until it held an interval open. With that interval the files run, and real failures surface that main never runs. One example: `packages/solid-queue/test/fork-supervisor.test.ts` fails in suite setup with `AdapterNotSpecified: The 'queue' database is not configured for the 'development' environment`, under plain vitest too.

## Acceptance criteria

- Find what drains the loop (a config/globalSetup/sequencer await with no handle), fix it, and make vitest's main step run every file in its shard.
- Add a guard so that a step whose vitest output has no `Test Files` summary fails CI.
- Fix, or file individually, the failures this uncovers, starting with fork-supervisor.test.ts's `development` env resolution (`Trails.env` reads only TRAILS_ENV/RACK_ENV, `packages/trailties/lib/database.ts:4-6`).
