---
title: "activerecord: pin_connection! runs verify! and begin_transaction under an adapter lock Rails does not take"
status: ready
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open by trails#8776.

Rails' `pin_connection!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:325-338`)
calls `@pinned_connection.verify!` and then `@pinned_connection.begin_transaction joinable: false, _lazy: false`
with no `synchronize` around them.

trails' `ConnectionPool#pinConnectionBang`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`) runs the two calls inside
`pinnedConnection.lock.synchronize`, receipted `@inventedArm synchronize`. trails#8776 added it because
two overlapping pins on a cold connection began a transaction twice. The traced order:

1. Context A's `verifyBang` finds the connection inactive, takes the adapter lock and runs
   `reconnectBang({ restoreTransactions: true })`
   (`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, Rails `reconnect!`,
   `abstract_adapter.rb:694-734`). `resetTransaction`
   (`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`, Rails
   `reset_transaction`, `abstract/database_statements.rb:412-426`) installs a temporary `TransactionManager`
   while its block runs.
2. Context B's `verifyBang` runs while A is inside that block. The raw connection is already set, so
   `active?` answers true and B skips the lock.
3. B's `beginTransaction` reads `transactionManager` (the temporary one) and then waits for the lock
   inside `TransactionManager#beginTransaction`.
4. A's reconnect restores the previous manager. B begins a real transaction on the orphaned manager,
   and A begins a second one on the restored manager, whose stack is empty.

Rails has the same unlocked reads. In trails every `await` inside `reconnect!` is a yield point, so the
window in step 2 is wide enough to hit deterministically.

## Converged shape

`pinConnectionBang` is Rails' body with no `synchronize`, and a `begin_transaction` that starts while a
`reconnect!` is in flight cannot begin on the temporary `TransactionManager`. If that cannot be done
without a guard Rails does not have, the guard is ratified in `packages/activerecord/CLAUDE.md` by the
repo owner and the receipt becomes `PERMANENT`.

## Findings (2026-10-11)

Measured on a branch with `pinConnectionBang` reduced to Rails' body:

- **PostgreSQL was missing a Rails lock.** Rails' `active?`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:348-357`)
  runs inside `@lock.synchronize`, and trails' `PostgreSQLAdapter#active` did not, so step 2 above
  let B through. With that lock ported, the concurrent-pin test passes on PostgreSQL with no lock in
  `pinConnectionBang`. That convergence shipped separately.
- **MariaDB already passes.** `Mysql2Adapter#active` takes the lock as Rails' does
  (`mysql2_adapter.rb:108-120`).
- **SQLite still begins twice.** Rails' `active?` (`sqlite3_adapter.rb:210-215`) takes no lock, so
  B's `verifyBang` answers true while A is inside `reset_transaction`'s block, and B begins on the
  temporary `TransactionManager`. Traced: B's `beginTransaction` ran on a manager with one
  transaction on its stack while the adapter's restored manager had none.

So the remaining guard is SQLite-only. Giving `SQLite3Adapter#active` the adapter lock
(`this.lock.synchronize(async () => this.isActive() ?? false)`) makes `pinConnectionBang` Rails' body
and passes `connection-pool.trails.test.ts`, `adapters/sqlite3/**` and `transactions.test.ts` on
SQLite, and the pool test on PostgreSQL and MariaDB. Rails has no such lock, so it needs the repo
owner's ruling: either that lock, ratified under `packages/activerecord/CLAUDE.md` § "The adapter
lock defaults to a monitor, not `NullLock`", or the lock in `pinConnectionBang` made `PERMANENT`.

## Acceptance criteria

- [ ] `pinConnectionBang` makes no `synchronize` call, or the call is ratified and its receipt is
      `PERMANENT`.
- [ ] "two concurrent contexts share the pool's single pinned connection"
      (`packages/activerecord/src/connection-pool.trails.test.ts`) still pins from both contexts at once
      and passes on every adapter lane.
