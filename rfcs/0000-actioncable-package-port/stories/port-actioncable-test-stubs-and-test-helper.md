---
title: "Port Action Cable's test stubs and test/test_helper.rb, with the first tests that use them"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps: ["port-actioncable-server-connections-and-base"]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' Action Cable suite runs against six stub files and a test helper.
Mirror them one file per Ruby file at
`packages/actioncable/src/test-helpers/` with the Ruby class names, the way
activerecord mirrors `test/models/`. Tests use these and do not invent their
own doubles.

- `vendor/rails/v8.0.2/actioncable/test/test_helper.rb` (41 lines): sets `ActionCable.server.config.cable =
{ "adapter" => "test" }` and a null logger (`:15-16`), and reopens
  `ActionCable::TestCase` with `wait_for_async`, `run_in_eventmachine`
  and `wait_for_executor` (`:18-39`), which polls
  `executor.completed_task_count == executor.scheduled_task_count` for up to
  two seconds.
- `stubs/test_server.rb`: `TestServer` includes the real
  `Server::Connections` and `Server::Broadcasting`, has a
  `FakeConfiguration < Server::Configuration`, a `Monitor`, a real
  `StreamEventLoop` whose `@executor` is swapped for
  `Concurrent.global_io_executor` (`:33-37`), and a real
  `Server::Worker.new(max_size: 5)`.
- `stubs/test_connection.rb`: `TestConnection`, with `identifiers`,
  a `TaggedLogging` logger, `transmissions`, `last_transmission`,
  `encode` / `decode`.
- `stubs/test_adapter.rb`: `SuccessAdapter < SubscriptionAdapter::Base`,
  recording `@@subscribe_called` / `@@unsubscribe_called`.
- `stubs/user.rb`, `stubs/room.rb`, `stubs/global_id.rb`: a stub
  `GlobalID` with `to_param` / `to_s`, and two models answering
  `to_global_id` and `to_gid_param`.

The two test files ported here are the first that need nothing beyond the
stubs: `subscription_adapter/base_test.rb` (6 cases) and
`server/broadcasting_test.rb` (3).

`ActionCable::TestCase` itself (`lib/action_cable/test_case.rb`) is ported
in `port-actioncable-test-helper-and-test-case`. Until it lands, the three
helper methods live on the suite's own base in `test-helpers/`, and that
story moves them onto the real class.

## Rails tests owned by this story

- Support files mirrored (no cases): `vendor/rails/v8.0.2/actioncable/test/test_helper.rb`, `vendor/rails/v8.0.2/actioncable/test/stubs/global_id.rb`, `vendor/rails/v8.0.2/actioncable/test/stubs/room.rb`, `vendor/rails/v8.0.2/actioncable/test/stubs/test_adapter.rb`, `vendor/rails/v8.0.2/actioncable/test/stubs/test_connection.rb`, `vendor/rails/v8.0.2/actioncable/test/stubs/test_server.rb`, `vendor/rails/v8.0.2/actioncable/test/stubs/user.rb`.
- `vendor/rails/v8.0.2/actioncable/test/subscription_adapter/base_test.rb`:
  - [ ] `#broadcast returns NotImplementedError by default` (`:18`)
  - [ ] `#subscribe returns NotImplementedError by default` (`:24`)
  - [ ] `#unsubscribe returns NotImplementedError by default` (`:33`)
  - [ ] `#broadcast is implemented` (`:43`)
  - [ ] `#subscribe is implemented` (`:49`)
  - [ ] `#unsubscribe is implemented` (`:58`)
- `vendor/rails/v8.0.2/actioncable/test/server/broadcasting_test.rb`:
  - [ ] `fetching a broadcaster converts the broadcasting queue to a string` (`:7`)
  - [ ] `broadcast generates notification` (`:15`)
  - [ ] `broadcaster from broadcaster_for generates notification` (`:34`)

## Fidelity traps (predicted at authoring)

- [ ] **`wait_for_async` is how the suite stays deterministic.** Almost every channel and connection test ends in it. If it returns before posted tasks (and the promises they return) settle, later assertions race. It must watch the same executor `TestServer#event_loop` posts to, and time out with Rails' message.
- [ ] **`TestServer#event_loop` swaps the executor by ivar.** `StreamEventLoop`'s `@executor` must be the field `rbObjIvarSet` writes.
- [ ] **The stub `GlobalID` is a top-level constant** that shadows the real gem, which Action Cable's tests never load. Keep it a test-helper class; do not import `@blazetrails/globalid`.
- [ ] **`SuccessAdapter` uses class variables** (`@@subscribe_called`) that tests read with `class_variable_get`.
- [ ] **`FakeConfiguration#initialize` does not call `super`**, so it has no `connection_class`, `worker_pool_size` or health check; only the three accessors it sets.
- [ ] **`#broadcast returns NotImplementedError by default`** and its two siblings use `assert_raises` around a call that returns a rejected promise in trails. Await it.
- [ ] **`broadcast generates notification`** subscribes to `broadcast.action_cable` and asserts the payload hash, including `coder`.
- [ ] **The suite's global setup mutates `ActionCable.server.config`.** It belongs in the package's vitest setup file, once, not per test file.

## Acceptance criteria

- [ ] `packages/actioncable/src/test-helpers/` mirrors the six stubs and the helper, one file per Ruby file.
- [ ] `subscription_adapter/base_test.rb` (6) and `server/broadcasting_test.rb` (3) are ported and credited.
- [ ] `waitForAsync` resolves only after tasks posted to the event loop, and promises those tasks return, have settled; a task that never settles fails with "Executor could not complete all tasks in 2 seconds".

## Definition of done

A `waitForAsync` that is a fixed `setTimeout`, or a `TestServer` with a fake event loop, does not close this story.
