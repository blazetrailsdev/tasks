---
title: "Drop ConnectionLeasingQueue#internalPoll's promise arm once Queue#poll settles on one shape"
status: blocked
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-05T20:06:45Z"
assignee: "conversion-and-serialization-tests-redeclare-shared-models"
blocked-by: "Precondition unreachable: the story converges only 'once Queue#poll settles on one shape', and Queue#poll cannot. Pool#acquireConnectionSync (connection-adapters/abstract/connection-pool.ts:584) calls this._available.poll() synchronously and returns DatabaseAdapter, feeding checkoutForExclusiveAccess (:1067-1069) and the :443 lease site — both structurally sync. Making internalPoll always-async turns poll() no-arg into a Promise and breaks those. That is the same wall as the sibling converge-sync-connection-lease-per-checkout-verify, itself blocked on an epic to make Arel::Nodes::Node#to_sql and the deprecated .connection getter async. Unblock when that epic lands."
closed-reason: null
---

## Context

Rails' `ConnectionLeasingQueue#internal_poll` is three lines
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/queue.rb:202-206`):

```ruby
def internal_poll(timeout)
  conn = super
  conn.lease if conn
  conn
end
```

`packages/activerecord/src/connection-adapters/abstract/connection-pool/queue.ts:246-262`
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

- `internalPoll` reads as Rails' three lines — one `conn.lease()` call site, no
  `then` branch and no `typeof ... === "function"` probe — once `Queue#poll`'s
  return type settles on one shape.
- The two `as` casts the probe forces go with it.
- Connection-pool and queue suites green on all three adapters.
