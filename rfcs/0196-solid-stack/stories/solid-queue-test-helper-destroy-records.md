---
title: "Port test_helper.rb destroy_records into solid-queue shared test support"
status: done
updated: 2026-11-20
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10409
claim: "2026-11-20T13:49:58Z"
assignee: "solid-queue-mariadb-snapshot-isolation-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.7.2/test/test_helper.rb:79-81` runs `destroy_records` in teardown for every non-transactional test. trails has no port of it in `packages/solid-queue/test/support`. Every test file hand-rolls its own `afterEach` cleanup instead, e.g. `Job`/`JobResult`/`Process.destroyAll` in `test/integration/async-processes-lifecycle.test.ts` and `Job`/`Semaphore`/`Process`/`JobResult` in `test/claimed-execution-concurrency.test.ts`. The reviewer raised this on trails#10375.

## Acceptance criteria

- `destroy_records` is ported at its Rails name into the shared test support, and the teardown runs it when `useTransactionalTests` is false, as `test_helper.rb` does.
- The per-file `afterEach` cleanup that duplicates it is removed from the solid-queue tests.
