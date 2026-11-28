---
title: "sqlite3-busy-handler-timeout-test-second-boundary-flake"
status: draft
updated: 2026-11-28
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

# sqlite3 busyHandlerTimeout= test flakes on a wall-clock second boundary

## Context

`packages/sqlite3/test/database.trails.test.ts:83` ("busyHandler hands the block to the engine, and busyHandlerTimeout= retries until the deadline") asserts `expect(await fake.handler!(1)).toBe(0)`. The handler's else arm is `rbFSleep(0.001)` (`packages/sqlite3/lib/database.ts:547`, mirroring `vendor/sqlite3/v2.7.3/lib/sqlite3/database.rb:703`).

`rbFSleep` (`packages/ruby-compat/lib/thread.ts:504-515`) answers `Math.floor(Date.now() / 1000) - beg`, whole wall-clock seconds, as MRI's `rb_f_sleep` answers `time(0) - beg`. A 1ms sleep that straddles a second boundary therefore answers 1, so the assertion fails about once per thousand runs regardless of load. Seen on trails#10849, run 46085017467, job 140792961101 (Active Record SQLite Tests (1)): `AssertionError: expected 1 to be +0`.

The implementation is faithful; the test's exact-zero assertion is what is wrong.

## Acceptance criteria

- The assertion at `database.trails.test.ts:83` no longer depends on the wall-clock second boundary (for example, assert the result is a sleep result in `[0, 1]`, or stub the clock), keeping the test name unchanged.
- `rbFSleep` and `setBusyHandlerTimeout` are unchanged.
