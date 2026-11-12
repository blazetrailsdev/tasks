---
title: "solid-queue-tests-opt-out-of-transactional-tests-like-rails"
status: draft
updated: 2026-11-12
rfc: "0196-solid-stack"
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

Rails' solid_queue test files that set `self.use_transactional_tests = false` (`vendor/solid_queue/v1.1.3/test/`):
`integration/processes_lifecycle_test.rb`, `models/solid_queue/job_test.rb`, `unit/scheduler_test.rb`, `integration/concurrency_controls_test.rb`, `integration/lifecycle_hooks_test.rb`, `integration/recurring_tasks_test.rb`, `integration/puma/plugin_test.rb`, `unit/supervisor_test.rb`, `unit/dispatcher_test.rb`.

The trails ports opt out only in `packages/solid-queue/test/scheduler.test.ts:28-33` and `test/integration/concurrency-controls.test.ts` (trails#10005). There, a `TestCase` subclass is seated with `constSet(TopLevel, "<Name>Test", …)`, and `packages/activesupport/lib/testing/autorun.ts` resolves the `describe` name to that class.

Every other port runs under the default `useTransactionalTests = true`, so transactional fixtures pin a connection. With the in-process supervisor (`test/support/processes-test-helper.ts:11`), the pinned connection is shared by the dispatcher and the workers. That caused the PG deadlock in `solid-queue-concurrency-controls-pg-timeouts`.

## Acceptance criteria

- `process.test.ts`/`processes-lifecycle.test.ts`, `job.test.ts`, `lifecycle-hooks.test.ts`, `recurring-tasks.test.ts`, `supervisor.test.ts` and `dispatcher.test.ts` each declare their Rails `*Test` class with `useTransactionalTests = false`, the way `scheduler.test.ts` does.
- Each file passes on PostgreSQL and SQLite.
