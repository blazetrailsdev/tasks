---
title: "thread-yielded-connection-internal-query-path"
status: done
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: 3876
claim: "2026-06-22T12:19:57Z"
assignee: "thread-yielded-connection-internal-query-path"
blocked-by: null
---

## Context

Follow-up to `with-connection-query-path` (PR #3564). That PR made common
APIs (`create!`/`first`/`count`/…) release their connection under
`permanent_connection_checkout = :deprecated | :disallowed` by wrapping the
relation read paths and the transaction path in
`withConnection(..., { preventPermanentCheckout: true })`. The flag neutralizes
the ~46 internal `.connection` (deprecated getter) reads on the build/execute/
callback path so they resolve to the already-checked-out connection instead of
flipping the lease to permanent.

Rails instead uses **plain `with_connection`** and threads the _yielded_
connection through its internal query/transaction code — it never calls
`.connection` internally (see `transactions.rb` `transaction` /
`with_transaction_returning_status`, which use the block's `connection`
parameter). The `preventPermanentCheckout` shim is therefore a mechanism
deviation: a user calling `Model.lease_connection` _inside_ `Model.transaction`
or a read path would NOT get a permanent lease in trails, whereas Rails would.

Internal `.connection` reads to converge (PR #3564 baseline):

- `relation.ts` (~23), `relation/calculations.ts` (~15),
  `persistence.ts` (~5), `transactions.ts` (~3).

## Acceptance criteria

- [ ] Internal query/transaction execution threads the connection yielded by
      `withConnection` (no `preventPermanentCheckout` shim); internal code no
      longer reads the deprecated `Model.connection` getter on the hot path.
- [ ] The wraps use plain `withConnection` (matching Rails' `with_connection`).
- [ ] `Model.leaseConnection()` invoked inside `Model.transaction` / a read
      path makes the lease permanent (matches Rails).
- [ ] ConnectionHandlingTest "common APIs don't permanently hold a connection…"
      still passes; no test:compare / api:compare regression.
