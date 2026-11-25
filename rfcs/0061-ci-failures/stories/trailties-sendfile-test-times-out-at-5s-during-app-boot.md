---
title: "trailties-sendfile-test-times-out-at-5s-during-app-boot"
status: closed
updated: 2026-11-25
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
closed-reason: "Delivered by trails#10555 (c13559f66c, 'give SendfileTest the isolated-app timeout'): origin/main sendfile.test.ts:34 is describe('SendfileTest', { timeout: 120_000 }), replacing the 5s default that fired — the AC's 'timeout that fits their real cost' arm."
---

## Context

On run 44977404735 (trails#10546), `Trailties Tests (1)` failed in `packages/trailties/test/application/middleware/sendfile.test.ts:48`, `SendfileTest > config.action_dispatch.x_sendfile_header defaults to nil`, with "Test timed out in 5000ms" (the test's reported duration was 34939ms). The log also shows "Failed to load the schema cache because of DatabaseConnectionError: There is an issue connecting with your hostname: 127.0.0.1." around it. The test does `makeBasicApp()` / `simpleController()` and boots an isolated app. The trailties project in `vitest.config.ts` sets `globalSetup` but no `testTimeout`, so the 5s default applies, while app-boot tests in this file take tens of seconds on a loaded runner. The PR only reshuffled shards.

## Acceptance criteria

- Find out why the timeout fires at 5000ms for a test that ran ~35s: whether a per-test timeout is missing, or the isolated child hangs on the 127.0.0.1 schema-cache connection.
- Fix the cause. That means either stopping the app boot from reaching for a database it isn't configured for (the schema-cache load against 127.0.0.1), or giving app-boot isolation tests a timeout that fits their real cost. Don't just retry.
- The file passes repeatedly under `--shard` on CI.
