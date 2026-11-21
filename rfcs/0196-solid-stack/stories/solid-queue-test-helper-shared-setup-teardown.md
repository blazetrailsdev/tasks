---
title: "Port test_helper.rb's shared setup/teardown with the use_transactional_tests guard"
status: done
updated: 2026-11-20
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10456
claim: "2026-11-20T22:59:33Z"
assignee: "solid-queue-test-helper-shared-setup-teardown"
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.7.2/test/test_helper.rb:61-82` declares one `setup` / `teardown` pair on `ActiveSupport::TestCase`. When `use_transactional_tests` is false, that pair runs `destroy_records` and resets `SolidQueue.on_thread_error`, `JobBuffer` and `SolidQueueAdapter.stopping`.

trails#10409 ported `destroy_records` as `destroyRecords` in `packages/solid-queue/test/test-helper.ts`. Each test file still calls it from its own `beforeEach` / `afterEach`, though. The per-file `TestCase` subclasses set `useTransactionalTests = false` (for example in `dispatcher.test.ts`), but that flag is not wired to any shared vitest hook, so the guard at `test_helper.rb:68,79` has no counterpart. The other parts of the setup/teardown pair (`on_thread_error`, `JobBuffer.clear`, removing the supervisor pidfile) are also hand-rolled in each file.

## Acceptance criteria

- `test-helper.ts` ports the `ActiveSupport::TestCase` setup/teardown blocks from `test_helper.rb:61-82` once, guarded on the test class's `useTransactionalTests`, and they run for every solid-queue test.
- The per-file `destroyRecords` / `JobBuffer.clear` / `onThreadError` hooks that duplicate those blocks are removed.
