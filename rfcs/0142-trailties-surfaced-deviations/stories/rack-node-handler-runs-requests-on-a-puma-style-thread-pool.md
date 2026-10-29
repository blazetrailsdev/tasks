---
title: "rack-node-handler-runs-requests-on-a-puma-style-thread-pool"
status: draft
updated: 2026-10-29
rfc: "0142-trailties-surfaced-deviations"
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

`Rack::Handler::Node#service` (`packages/rack/src/handler/node.ts:86`) wraps
every request in `new Thread(async () => …)`, so each request pays a whole
ruby-compat `Thread` construction: id, `_threads` registration, the
creation-frame `Error` (`packages/ruby-compat/src/thread.ts`, `_creationFrame`),
an async-context slot `run`, and the promise bookkeeping in the constructor.
`upgrade` (`node.ts:133`) does the same.

Puma, the server `trails server` stands in for, does not start a thread per
request. `Puma::ThreadPool` (puma 8.0.2, `lib/puma/thread_pool.rb`) spawns
`min_threads`..`max_threads` long-lived threads (`spawn_thread`), and `<<`
pushes the client onto `@todo` for an idle one to pick up. Per-request
thread-locals are reset by the request cycle (`ActionDispatch::Executor`,
`ActiveSupport::IsolatedExecutionState`), not by a fresh thread. Puma is not
vendored; vendor it (or cite its gem source) before porting.

Measured 2026-10-29 on the twelve-dollar-server example: Thread construction
is ~2% of CPU on `GET /posts/:id` after the lazy creation-frame change, and a
bare `new Thread(async () => 1).value()` costs ~7µs.

## Acceptance criteria

- The Node handler runs requests on a pool of long-lived ruby-compat
  `Thread`s shaped like `Puma::ThreadPool` (names and control flow from
  `thread_pool.rb`), not one `new Thread` per request.
- Per-request thread state does not leak between requests on the same pool
  thread: a test sets `Thread.current[...]` in one request and reads it unset
  in the next, and `ActiveSupport::CurrentAttributes` is reset as in Rails.
- Concurrent async requests on one pool thread still see their own
  `Thread.current` (or the pool is sized so they never share one); a test
  pins whichever rule is chosen.
- Pinned single-core `ab -k` throughput on the twelve-dollar-server example
  is measured before and after and recorded in the PR.
