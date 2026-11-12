---
title: "ExecutionWrapper.wrap fiber deadlocks on the pinned fixture connection"
status: draft
updated: 2026-11-12
rfc: "0216-actionmailbox-port"
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

`ExecutionWrapper.wrap` (`packages/activesupport/lib/execution-wrapper.ts:124+`) runs a non-nested wrap on a new `Fiber`. The transactional-fixture pinned connection (`pinConnectionBang`, `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:347-364`) sets `setLockThread(IsolatedExecutionState.context())`, owned by the test's Fiber. A job performed inside the test (ActionMailbox `RoutingJob` via `route_later`, `vendor/rails/v8.0.2/actionmailbox/app/models/action_mailbox/inbound_email/routable.rb`) wraps in a new Fiber and deadlocks on the connection lock. Rails' `lock_thread = ActiveSupport::IsolatedExecutionState.context` with `isolation_level :thread` lets the same thread's fibers share it.
Surfaced by actionmailbox-test-dummy-app-and-transactional-tests: `RoutingTest > delayed routing` hangs.

## Acceptance criteria

- A job performed inline from inside a transactional test reuses the pinned connection without deadlock.
- actionmailbox `unit/inbound-email/routing` "delayed routing" passes under transactional tests.
