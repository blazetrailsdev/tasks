---
title: "Drop ConnectionLeasingQueue#internalPoll's promise arm once Queue#poll settles on one shape"
status: blocked
updated: 2026-09-23
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps:
  [
    "converge-sync-connection-lease-per-checkout-verify",
    "converge-connection-pool-lifecycle-exclusive-access-async",
  ]
deps-rfc: []
est-loc: 80
priority: 10
pr: null
claim: "2026-09-23T20:53:28Z"
assignee: "connection-leasing-queue-internal-poll-carries-a-promise-arm"
blocked-by: "RFC 0152 Open question 2 answered no: AC bullet 1 keeps poll() synchronous for acquireConnectionSync (connection-pool.ts:526,531) while poll(timeout) returns a promise; one conn.lease() site covering a sync value and a promise needs a then/probe or an await, and await makes poll() async. A single-arm internalPoll exists only once acquireConnectionSync retires, i.e. after sync-acquire-cannot-complete-reap-before-retry. Measured on trails#8016."
closed-reason: null
---

## Context

The pool-checkout RFC `0000-pool-checkout-async-convergence` (Seam inventory §3, Design §3)
owns this story. It will be rehomed there once that RFC merges. The earlier
NullLock blocker does not apply: the promise arm is forced by the async
`waitPoll` (`queue.ts:214`), not by the adapter lock.

Rails' `ConnectionLeasingQueue#internal_poll` is three lines
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/queue.rb:202-206`):

```ruby
def internal_poll(timeout)
  conn = super
  conn.lease if conn
  conn
end
```

`packages/activerecord/src/connection-adapters/abstract/connection-pool/queue.ts:243-257`
carries a second arm Rails does not have, because `super.internalPoll` can
answer a promise where Ruby's blocking `wait_poll` answers the connection
itself:

```ts
const conn = super.internalPoll(timeout);
if (conn && typeof (conn as { then?: unknown }).then === "function") {
  return (conn as Promise<DatabaseAdapter>).then((conn) => {
    conn.lease();
    return conn;
  });
}
if (conn) (conn as DatabaseAdapter).lease();
return conn;
```

PR #7276 (`retire-queue-invented-lease-and-reject-surface`) removed this file's
other four invented names — `rejectAll` and the `leaseTo`/`unlease`/`leasedTo`
side table — and converged the lease onto the connection as `queue.rb:204`
does, but left the promise arm: it is forced by `Queue#poll`'s
`Promise<DatabaseAdapter> | DatabaseAdapter | undefined` return, not by
anything local, so it converges with the pool's sync/async surface rather than
on its own.

Related: `converge-sync-connection-lease-per-checkout-verify` and
`synchronize-lock-barges-in-the-release-window` in this RFC touch the same
seam.

## Acceptance criteria

- The no-timeout `poll()` stays synchronous. It is Rails' non-blocking
  `no_wait_poll` (`queue.rb:71-78`), and `acquireConnectionSync` needs it.
  `poll(timeout)` always returns a promise.
- `internalPoll` has one `conn.lease()` call site, no `then` branch and no
  `typeof ... === "function"` probe. Its shape is Rails' three lines if
  possible (RFC Open question 2). If no single-arm shape exists, this story is
  blocked with the measured reason, not ratified.
- The `as` casts the probe forces in `queue.ts`, and the pool's no-timeout
  `poll()` casts (`connection-pool.ts:1103,1108`), go with it.
- Connection-pool and queue suites green on all three adapters.
