---
title: "activerecord: SQLite3Adapter#active? takes the adapter lock, and pin_connection! drops its invented synchronize"
status: ready
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open by trails#8776. Ruled by the repo owner on 2026-10-11: the guard moves to
`SQLite3Adapter#active`, and `pinConnectionBang` takes Rails' body.

Rails' `pin_connection!`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:325-338`)
calls `@pinned_connection.verify!` and then `@pinned_connection.begin_transaction joinable: false, _lazy: false`
with no `synchronize` around them.

trails' `ConnectionPool#pinConnectionBang`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`) runs the two calls inside
`pinnedConnection.lock.synchronize`, receipted
`@inventedArm synchronize — CONVERGEABLE pin-connection-runs-verify-and-begin-under-an-invented-adapter-lock`.
trails#8776 added it because two overlapping pins on a cold connection began a transaction twice:

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
window in step 2 is hit deterministically. That is the shortcoming already ratified in
`packages/activerecord/CLAUDE.md` § "The adapter lock defaults to a monitor, not `NullLock`".

## Why the guard belongs in `SQLite3Adapter#active`

Measured on 2026-10-11 with `pinConnectionBang` reduced to Rails' body:

- **PostgreSQL passes.** Rails' `active?` (`postgresql_adapter.rb:348-357`) runs inside
  `@lock.synchronize`, and trails' port now does too (shipped separately), so B waits in step 2.
- **MariaDB passes.** `Mysql2Adapter#active` takes the lock as Rails' does (`mysql2_adapter.rb:108-120`).
- **SQLite begins twice.** Rails' `active?` (`sqlite3_adapter.rb:210-215`) takes no lock, so B's
  `verifyBang` answers true while A is inside `reset_transaction`'s block.

So the gap is SQLite-only, and the lock goes where the other two adapters already hold one in Rails.
`pinConnectionBang` is shared pool code that all three adapters run, and it carries no deviation. The
same section already ratifies `SQLite3Adapter#disconnectBang` closing its handle under `lock` where
Rails' `disconnect!` does not.

## Converged shape

- `SQLite3Adapter#active` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) is
  `this.lock.synchronize(async () => this.isActive() ?? false)`, receipted
  `@inventedArm synchronize — PERMANENT`. `isActive` keeps Rails' body (`sqlite3_adapter.rb:210-215`).
  `SQLite3Adapter#reconnect` calls `active()` from inside `reconnectBang`'s lock; the monitor is
  reentrant for the holder's own nested call, so that call does not wait.
- `ConnectionPool#pinConnectionBang` ends as Rails' does: `await pinnedConnection.verifyBang()` then
  `await pinnedConnection.beginTransaction({ joinable: false, _lazy: false })`, with no `synchronize`.
  Its `@inventedArm synchronize` receipt is deleted. The `@inventedArm if — PERMANENT` receipt is
  not part of this story and stays.
- `packages/activerecord/CLAUDE.md` § "The adapter lock defaults to a monitor, not `NullLock`" gains
  the ratifying sentence beside the `disconnectBang` one: `SQLite3Adapter#active` answers under `lock`,
  where Rails' `active?` (`sqlite3_adapter.rb:210-215`) takes none, so a `verify!` cannot answer while
  a `reconnect!` is inside `reset_transaction`'s block.

## Acceptance criteria

- [ ] `pinConnectionBang` makes no `synchronize` call and carries no `@inventedArm synchronize` receipt.
- [ ] `SQLite3Adapter#active` answers under `this.lock.synchronize`, receipted
      `@inventedArm synchronize — PERMANENT`.
- [ ] `packages/activerecord/CLAUDE.md` § "The adapter lock defaults to a monitor, not `NullLock`"
      records the `SQLite3Adapter#active` lock.
- [ ] "two concurrent contexts share the pool's single pinned connection"
      (`packages/activerecord/src/connection-pool.trails.test.ts`) still pins from both contexts at once
      and passes on every adapter lane.
- [ ] `adapters/sqlite3/**` and `transactions.test.ts` pass on SQLite.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:arms:throws` are green.
