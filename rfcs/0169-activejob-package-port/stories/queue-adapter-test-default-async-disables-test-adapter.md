---
title: "queue-adapter-test-default-async-disables-test-adapter"
status: claimed
updated: 2026-10-22
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-22T15:46:39Z"
assignee: "port-activejob-test-helper-test-performed-part-3"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/test/cases/queue_adapter_test.rb:54-65` "should default to :async adapter if no adapters are set at all" starts with `ActiveJob::Base.disable_test_adapter`. That is `ActiveJob::TestHelper::TestQueueAdapter::ClassMethods#disable_test_adapter` (`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb:27-29`, `self._test_adapter = nil`), which trails has not ported (no `disableTestAdapter` / `_testAdapter` in `packages/activejob/src`). The port in `packages/activejob/src/queue-adapter.test.ts` (trails#9203) therefore omits the call.

## Acceptance criteria

- [ ] `TestQueueAdapter`'s `_test_adapter` class attribute, `disable_test_adapter` and `enable_test_adapter` (`test_helper.rb:15-35`) are ported, and `queue_adapter` reads `_test_adapter` first as Rails does.
- [ ] The queue-adapter test calls `Base.disableTestAdapter()` first, as `queue_adapter_test.rb:55` does.
