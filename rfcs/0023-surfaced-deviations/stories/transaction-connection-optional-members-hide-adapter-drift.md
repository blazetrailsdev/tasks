---
title: "transaction-connection-optional-members-hide-adapter-drift"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: TransactionConnection is a TS interface with no Rails counterpart (Ruby ducks the adapter). Tightening its optional members is typing hygiene for test doubles; the defensive ?.() sites are a consequence, not a behavioral divergence from transaction.rb."
---

## Context

`TransactionConnection` (`packages/activerecord/src/connection-adapters/abstract/transaction.ts`)
declares nearly its whole adapter surface as optional:

```ts
active?(): boolean | Promise<boolean>;
beginDbTransaction?(): void | Promise<void>;
commitDbTransaction?(): void | Promise<void>;
...
```

Every real adapter implements all of them — Rails' `Transaction` just calls
`connection.begin_db_transaction` etc. unconditionally
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb`).
The optionality exists only so inline test doubles can supply a subset, and it
forces defensive call sites like `(await conn.active?.()) !== false` in
`SavepointTransaction#rollback` where Rails writes a plain call.

Concrete cost, observed on PR #5967: two doubles in `transactions.trails.test.ts`
declared `active: true` as a property. Because they are passed through
`new TransactionManager(conn as never)`, the optional-property shape plus the
`as never` cast hid the getter-to-method flip from tsc entirely — the break only
appeared as a runtime `conn.active is not a function` in CI, on three lanes.

## Acceptance criteria

- The members of `TransactionConnection` that every adapter implements become
  required, so a shape change in an adapter method breaks the doubles at
  typecheck time.
- The `as never` casts on `new TransactionManager(...)` in
  `transactions.trails.test.ts` are dropped (or narrowed to a typed partial
  helper) so the doubles are actually checked.
- Defensive `?.()` call sites that only existed for the optionality — notably
  `SavepointTransaction#rollback`'s `(await conn.active?.()) !== false` — become
  plain calls matching Rails.
