---
title: "Port solid-queue's missing model and unit tests (claimed/failed execution, process, supervisor, hooks)"
status: in-progress
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 500
priority: 3
pr: trails#9869
claim: "2026-11-08T13:45:22Z"
assignee: "solid-queue-parity-api-100"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package solid-queue --missing` on origin/main (45db00824f) reports 89/172 tests (51.7%). This story covers the model and unit files, 24 tests:

- `models/solid_queue/claimed_execution_test.rb` (5), `failed_execution_test.rb` (4) and `process_test.rb` (5) have no TS file.
- `job_test.rb`: "try to discard claimed job".
- `unit/worker_test.rb`: "errors on claimed executions are reported via Rails error subscriber regardless of on_thread_error setting".
- `unit/supervisor_test.rb`: "start with empty configuration", "start with invalid recurring tasks", "fail orphaned executions".
- `unit/hooks_test.rb` (1, "solid_queue_record hook ran") and `solid_queue_test.rb` (1, version). `version.trails.test.ts` exists but does not sit at the Rails path.

## Acceptance criteria

- Each listed Ruby test is ported at its convention path (`claimed-execution.test.ts`, `failed-execution.test.ts`, `process.test.ts`, `hooks.test.ts`, `solid-queue.test.ts`) under its Rails name, and passes on all three adapter lanes.
- A behavior gap a test exposes is fixed in source, not skipped.
