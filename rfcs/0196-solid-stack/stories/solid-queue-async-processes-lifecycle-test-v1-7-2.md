---
title: "Converge processes-lifecycle.test.ts onto v1.7.2 async_processes_lifecycle_test.rb"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/integration/processes-lifecycle.test.ts` (`describe("ProcessesLifecycleTest")`) still mirrors solid_queue v1.1.3's `test/integration/processes_lifecycle_test.rb`. The v1.7.2 bump (#10181) removed that file and split it into `vendor/solid_queue/v1.7.2/test/integration/async_processes_lifecycle_test.rb`, `forked_processes_lifecycle_test.rb` and `fiber_processes_lifecycle_test.rb`. trails runs supervisees in process, so its counterpart is `AsyncProcessesLifecycleTest`. trails#10191 converged one test ("term supervisor exceeding timeout while there are jobs in-flight", `async_processes_lifecycle_test.rb:139-181`); the file's other tests and its setup still follow v1.1.3 bodies.

## Acceptance criteria

- The file becomes `async-processes-lifecycle.test.ts` with `describe("AsyncProcessesLifecycleTest")`, every test name and body taken from `async_processes_lifecycle_test.rb` (setup and teardown included).
- Tests only in the v1.1.3 file are removed; tests new in v1.7.2's async file are ported.
- `parity:test` delta is non-negative, and the file passes on SQLite, PostgreSQL and MariaDB.
