---
title: "solid-queue test helper and test job classes are registered constants, not toString-named"
status: done
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9411
claim: "2026-10-28T16:19:26Z"
assignee: "call-gate-credits-typed-fetch-on-plain-object-config-receivers"
blocked-by: null
closed-reason: null
---

## Context

trails#9362 seated every solid-queue source class with `registerConstant` and removed the invented `static toString()` names. The test-side classes still name themselves through `static toString()`:

- `packages/solid-queue/src/test-helpers/application-job.ts:19` (dummy app `ApplicationJob`, `vendor/solid_queue/v1.1.3/test/dummy/app/jobs/application_job.rb`)
- `packages/solid-queue/src/test-helpers/add-to-buffer-job.ts:13` (`AddToBufferJob`, `test/dummy/app/jobs/add_to_buffer_job.rb`)
- `packages/solid-queue/src/test-helpers/job-result.ts:22` (`JobResult`, `test/dummy/app/models/job_result.rb`)
- inline job classes in `recurring-task.test.ts:19-75` and `worker.test.ts:25-32`

## Acceptance criteria

- Each class is seated with `registerConstant("<Ruby name>", Klass)` and its `toString` override is deleted.
- Any consumer that still reads a class name through `String(klass)` reads `rbModName` instead.
- The solid-queue tests stay green.
