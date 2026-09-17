---
title: "Port ConnectionPool#reap: the body is a guard behind three PERMANENT receipts"
status: in-progress
updated: 2026-09-17
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#7860
claim: "2026-09-17T22:32:45Z"
assignee: "port-connection-pool-reap-body"
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit.
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:708-714`:

```ts
/** @missingRailsCall checkin — PERMANENT */
/** @missingRailsCall remove — PERMANENT */
/** @missingRailsCall select — PERMANENT */
reap(): void {
  if (this.isDiscarded()) return;
}
```

Rails' `ConnectionPool#reap`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:625-642`)
selects in-use connections whose owner is dead, `steal!`s them inside
`synchronize`, then `reset!` + `checkin`s the active ones and `remove`s the rest.
The trails body is the guard alone; three PERMANENT receipts hide that the
method is hollow. Owner liveness is the only part with a JS question attached
(`conn.owner.alive?` against trails' execution-context leases,
`IsolatedExecutionState`); that is not grounds for dropping `checkin`/`remove`.

## Acceptance criteria

- `reap` ports the Rails body: select stale leased connections, `steal!` them
  under the monitor, then `reset!`+`checkin` or `remove`.
- Its three `@missingRailsCall … PERMANENT` receipts are deleted.
- A test mirrors Rails' `connection_pool_test.rb` reap cases
  (`test_reap_and_active`, `test_reap_inactive`) under their Rails names.
