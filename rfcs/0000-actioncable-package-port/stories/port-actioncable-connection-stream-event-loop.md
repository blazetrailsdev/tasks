---
title: "Port Connection::StreamEventLoop (timer, post, attach, detach, stop)"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps:
  [
    "port-actioncable-namespace-and-internal-constants",
    "ruby-compat-thread-pool-executor-shutdown-and-task-counts",
    "ruby-compat-concurrent-timer-task-and-atomic-fixnum",
    "ratify-node-event-loop-stands-in-for-the-nio4r-selector",
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

`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream_event_loop.rb` (136 lines), **Tier 2**. It has no
Rails test file; Rails' `TestServer` stub builds a real one
(`vendor/rails/v8.0.2/actioncable/test/stubs/test_server.rb:33-37`), so every channel and connection test
runs through it. It lands before those tests for that reason.

Ported as ordinary code:

- `initialize` (`:10-17`).
- `timer(interval, &block)` (`:19-21`):
  `Concurrent::TimerTask.new(execution_interval: interval, &block).tap(&:execute)`.
- `post(task = nil, &block)` (`:23-28`): `task ||= block`, then
  `@executor << task`. Rails creates the executor inside `spawn`
  (`:70-74`: min 1, max 10 threads, `max_queue: 0`); with no loop thread to
  spawn, the `@executor ||=` moves to where `post` needs it. Rails' test
  stub overwrites `@executor` with `Concurrent.global_io_executor` through
  `instance_variable_set`, so the ivar must be settable from outside.
- `stop` (`:56-59`).

Ported per the CLAUDE.md section from
`ratify-node-event-loop-stands-in-for-the-nio4r-selector`:

- `attach(io, stream)` (`:30-36`) registers the socket's listeners and holds
  them in `@map`; the listeners call `stream.receive(incoming)` and
  `stream.close` where `run` does (`:111-129`).
- `detach(io, stream)` (`:38-45`) removes them, deletes the map entry and
  closes the socket.
- `writes_pending` (`:47-54`): kept or skipped as that section decides.

Not ported: private `spawn` (`:62-80`), `wakeup` (`:82-84`) and `run`
(`:86-133`), already in `SCOPED_SKIP_GROUPS`. Each call Rails makes to them
from a ported body (`spawn` in `post`; `wakeup` in `attach` / `detach`
/ `stop`) carries `@missingRailsCall … — PERMANENT` at the call site,
citing the section.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream_event_loop.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`run`'s rescue arm** (`:120-129`): any error while reading closes the stream, and if that close raises too the socket is deregistered. The `error` listener must do both, or one bad socket leaves a map entry behind.
- [ ] **`nil` from `read_nonblock` means EOF** and calls `stream.close`. Node's analogue is `end`; `close` after `error` must not call `stream.close` twice in a way that double-fires `on_close`.
- [ ] **`detach` closes the io** (`io.close`, `:42`). `client_socket_test.rb:52-63` asserts the hijacked io's `close` is called at shutdown. Call the method the test can observe.
- [ ] **`@map` is keyed by the io object**, not by a file descriptor number.
- [ ] **`post` accepts a callable or a block** and prefers the positional one.
- [ ] **A task posted to the executor may be async.** `pubsub.subscribe` inside `post { }` returns a promise; a rejection there must be reported, not left unhandled.
- [ ] **`stop` sets `@stopping`** and nothing reads it once `run` is gone. Decide in the story whether `stop` shuts the executor down or only flips the flag, and receipt the difference at the call site.

## Acceptance criteria

- [ ] `stream_event_loop.rb` reads complete in `parity:api` apart from the skip group; every omitted call has a `@missingRailsCall … — PERMANENT` receipt citing the CLAUDE.md section, and nothing is baselined.
- [ ] `timer` returns an object with `shutdown`; `post` runs a task on the executor.
- [ ] A `.trails.test.ts` attaches a `net` socket pair, asserts `stream.receive` gets the bytes, `stream.close` runs on EOF and on error, and `detach` closes the socket and empties the map.

## Definition of done

An `attach` that never reaches `stream.receive`, or a body for `spawn` / `run` / `wakeup`, does not close this story.
