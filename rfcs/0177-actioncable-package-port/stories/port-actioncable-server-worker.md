---
title: "Port Server::Worker and Worker::ActiveRecordConnectionManagement"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable", "activerecord"]
deps:
  [
    "port-actioncable-namespace-and-internal-constants",
    "port-actioncable-connection-tagged-logger-proxy",
    "ruby-compat-thread-pool-executor-shutdown-and-task-counts",
  ]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/worker.rb` (75 lines) and
`worker/active_record_connection_management.rb` (23). **Tier 1**: ruby-compat
already has `Concurrent::ThreadPoolExecutor`
(`packages/ruby-compat/src/thread-pool-executor.ts:14`), whose tasks each run
in a ruby-compat `Thread`, so the file ports line for line and
`worker_pool_size` keeps its meaning as the cap on invocations in flight.

- `include ActiveSupport::Callbacks`, `thread_mattr_accessor :connection`,
  `define_callbacks :work`, `include ActiveRecordConnectionManagement`
  (`:13-17`).
- `initialize(max_size: 5)` builds the executor (`:21-28`); `halt` is
  `@executor.shutdown` (`:32-34`); `stopping?` is
  `@executor.shuttingdown?` (`:36-38`).
- `work(connection, &block)` sets the per-thread connection, runs the
  `:work` callbacks, and clears it in `ensure` (`:40-46`).
- `async_exec` (`:48-50`), `async_invoke` (`:52-56`), `invoke`
  (`:58-67`) with its `rescue Exception` that logs twice and calls
  `receiver.handle_exception` when the receiver responds to it.
- `ActiveRecordConnectionManagement` (`:11-19`):
  `if defined?(ActiveRecord::Base)` adds an around callback
  `with_database_connections`, which is
  `connection.logger.tag(ActiveRecord::Base.logger, &block)`.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/server/worker.rb`
- `vendor/rails/v8.0.2/actioncable/lib/action_cable/server/worker/active_record_connection_management.rb`

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/worker_test.rb`:
  - [ ] `invoke` (`:37`)
  - [ ] `invoke with arguments` (`:42`)

## Fidelity traps (predicted at authoring)

- [ ] **`work` must await before clearing the connection.** `run_callbacks :work, &block` runs a block that is async in trails (channel actions do I/O). Ruby's `ensure` runs after the block; a JS `finally` after an unawaited promise clears `connection` while the action is still running.
- [ ] **`thread_mattr_accessor`** is `threadMattrAccessor` (`packages/activesupport/src/index.ts:287`). Two tasks in flight at once each need their own value: check the per-thread store keys on the ruby-compat `Thread` each executor task runs in (RFC 0147).
- [ ] **`invoke` rescues `Exception`**, not `StandardError`, and does not re-raise. The rescue is inside the `work` block, so the callbacks' after-half still runs.
- [ ] **`receiver.send method, *args, &block`** is `rbFSend`, which dispatches private methods; `Connection::Base#send_async` targets private `handle_open` / `handle_close`.
- [ ] **`async_exec` uses `instance_exec`**: the block runs with `self` as the receiver, which is how a `periodically` lambda reaches the channel's private methods.
- [ ] **`connection: receiver` default** (`:52`) names another parameter. A TS default cannot be forwarded as an explicit `undefined`; match Ruby's kwarg semantics.
- [ ] **`defined?(ActiveRecord::Base)` is evaluated once, at include time.** Read `TopLevel.ActiveRecord?.Base` there (CLAUDE.md § "Call-time constant resolution"); `0169/port-activejob-enqueue-after-transaction-commit` seats it. If it is not seated yet, seat it from activerecord in this story. Do not add an `@blazetrails/activerecord` dependency.
- [ ] **`e.backtrace.join("\n")`**: a JS error may have no stack.
- [ ] **The private `logger` reads `ActionCable.server.logger`**, the global server, not the connection's logger.
- [ ] **`worker_test.rb` extends `ActionCable::TestCase` but uses none of its helpers.** It lands before the suite's test helper; port it on `ActiveSupport::TestCase` semantics alone and do not pull the stubs story forward.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`; `worker.rb` has no `@missingRailsCall` receipt.
- [ ] `worker_test.rb`'s two cases are ported and credited.
- [ ] A `.trails.test.ts` covers: an async block finishing before `connection` is cleared; two overlapping `async_invoke`s seeing their own `connection`; `invoke` logging and calling `handle_exception` on a raise; `halt` making `stopping?` true.

## Definition of done

Replacing the executor with a bare `queueMicrotask` or `Promise.resolve().then` does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/server/worker.trails.test.ts packages/actioncable/src/server/worker/active-record-connection-management.trails.test.ts packages/actioncable/src/worker.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
