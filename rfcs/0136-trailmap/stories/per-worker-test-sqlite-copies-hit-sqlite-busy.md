---
title: "Per-worker test.sqlite3-N copies hit SQLITE_BUSY after an interrupted run"
status: ready
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test/test-helper.ts` copies `storage/test.sqlite3` to one `storage/test.sqlite3-N` per vitest worker, as Rails' `parallelize` does. After an interrupted or timed-out controller run (2026-11-26, load average about 130), those copies were left with `-wal` and `-shm` sidecars. The next single-file run, `npx vitest run test/controllers/api-controller.test.ts`, failed three times in a row before any test ran: `SqliteError: database is locked` / `SQLITE_BUSY` in setup ("Tests no tests"). It passed only after the process still holding the files had exited.

This is a different failure from `hub-backed-tests-flake-*` and `hub-suites-time-out-waiting-for-the-advisory-lock-under-load`, which are about the shared hub database.

## Shape expected

- Each run gets its own per-worker copies: unique per run, e.g. a run id in the file name or a temp directory, or recopied with the old sidecars deleted. One run's leftovers can never lock the next.
- Or setup sets `busy_timeout`, so a briefly held lock waits instead of failing the whole file.

## Acceptance criteria

- Killing a controller run mid-way (SIGKILL), then immediately running one controller test file, passes.
