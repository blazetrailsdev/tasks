---
title: "solid-queue tests sleep through rbFSleep, not a bare setTimeout"
status: done
updated: 2026-11-23
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10623
claim: "2026-11-23T02:24:04Z"
assignee: "activejob-continuation-v8-1"
blocked-by: null
closed-reason: null
---

## Context

trails#10591 fixed `rbFSleep` (`packages/ruby-compat/lib/thread.ts`), ruby-compat's `Kernel#sleep`. It now keeps sleeping until the monotonic deadline has passed, as MRI's `sleep_hrtime` / `hrtime_update_expire` loop does (`vendor/ruby/v3.3.11/thread.c:1278-1311`). A bare `setTimeout` can fire a fraction of a millisecond early, which made `BootGuardsTest` flaky. The PR moved only `boot-guards.test.ts` onto `rbFSleep`.

Other solid-queue test code still hand-rolls `const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000))` where Rails calls `Kernel#sleep`:

- `packages/solid-queue/test/support/processes-test-helper.ts:19` (exported `sleep`)
- `packages/solid-queue/test/support/update-result-job.ts` (`sleep(pause) if pause`, `vendor/solid_queue/v1.7.2/test/dummy/app/jobs/update_result_job.rb:6`)
- `packages/solid-queue/test/recurring-task.test.ts`
- `packages/solid-queue/test/dispatcher.trails.test.ts`

## Acceptance criteria

- Each site calls `rbFSleep` from `@blazetrails/ruby-compat`, and the hand-rolled `sleep` consts are deleted.
- The affected solid-queue test files pass.
