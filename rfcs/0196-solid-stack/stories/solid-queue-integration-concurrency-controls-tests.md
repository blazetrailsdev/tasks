---
title: "solid-queue-integration-concurrency-controls-tests"
status: done
updated: 2026-11-11
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9988
claim: "2026-11-11T11:41:32Z"
assignee: "solid-queue-integration-concurrency-controls-tests"
blocked-by: null
closed-reason: null
---

## Context

Split out of `solid-queue-integration-jobs-concurrency-recurring-tests` for the 800-LOC ceiling.
`vendor/solid_queue/v1.1.3/test/integration/concurrency_controls_test.rb` (8 tests, 203 lines) has no TS port:
`limits_concurrency` blocking, semaphore expiry, dispatcher unblocking. The sibling ports in
`packages/solid-queue/src/integration/jobs-lifecycle.test.ts` show the Worker/Dispatcher setup, and
`packages/solid-queue/src/test-helpers/jobs-test-helper.ts` carries `waitForJobsToFinishFor` /
`silentOnThreadErrorFor`. The dummy jobs it needs (`SequentialUpdateResultJob`, `NonOverlappingUpdateResultJob`,
`ThrottledUpdateResultJob`, `vendor/solid_queue/v1.1.3/test/dummy/app/jobs/`) are unported.

## Acceptance criteria

- `packages/solid-queue/src/integration/concurrency-controls.test.ts` ports all 8 tests under their Rails names,
  with the dummy jobs ported under `src/test-helpers/`, passing on all three adapter lanes.
- A source gap a test exposes is fixed.
