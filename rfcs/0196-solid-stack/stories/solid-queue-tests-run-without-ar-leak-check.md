---
title: "solid-queue tests run without AR's leak check; dummy shutdown_timeout 2s"
status: draft
updated: 2026-11-25
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10744 added a trails-only line to `WorkerTest`'s teardown
(`packages/solid-queue/test/worker.test.ts:63`,
`if (worker.pool.isShutdown()) await worker.pool.waitForTermination(null);`).
Rails' teardown is `@worker.stop; JobBuffer.clear`
(`vendor/solid_queue/v1.7.2/test/unit/worker_test.rb:11-14`).

The line exists because solid-queue tests run in the `activerecord` vitest
project (`vitest.config.ts`, include `packages/solid-queue/test/**/*.test.ts`),
whose setup file `packages/activerecord/test/cases/helper.ts` installs AR's own
`TestCase#checkConnectionLeaks` (`activerecord/test/cases/test_case.rb:41-79`)
after every teardown. Solid Queue's suite (`test/test_helper.rb`) has no such
check. Also, Rails' dummy app sets `config.solid_queue.shutdown_timeout = 2.seconds`
(`vendor/solid_queue/v1.7.2/test/dummy/config/environments/test.rb:61`), which
trails' test setup does not mirror (it runs on the 5s default).

## Acceptance criteria

- solid-queue tests no longer run AR's internal-suite leak check (their own
  project or setup file, without `activerecord/test/cases/helper.ts`'s
  after-teardown leak check), so abandoned jobs after `stop` behave as in Ruby.
- The test dummy sets `shutdownTimeout` to 2 seconds as `test.rb:61` does.
- The added teardown line in `worker.test.ts` is removed; `WorkerTest`'s
  teardown matches `worker_test.rb:11-14`.
