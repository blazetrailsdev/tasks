---
title: "Audit and guard test-tree connection pools leaked into the writing list"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6126
claim: "2026-08-05T12:15:04Z"
assignee: "datetime-new-start-preserves-the-receiver"
blocked-by: null
closed-reason: null
---

## Context

PR #6109 landed the literal `setup_transactional_fixtures` setup line — pinning
every writing pool up front
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:175-180`). Rails'
`pin_connection!` **eagerly verifies** the connection
(`connection_adapters/abstract/connection_pool.rb:335`,
`@pinned_connection.verify!`), so any pool sitting in
`connection_pool_list(:writing)` is now actually connected at the start of every
transactional test.

That turned a previously-invisible class of test leak into a hard, _cross-file_
CI failure. `connection-handling.test.ts`'s "autoConnect honors an in-memory
DatabaseConfigurations registry" established a pool on a throwaway
`InMemoryModel` with `database: "db/common.sqlite3"`, restored
`Base.configurations` in its `finally`, but never removed the pool. Nothing
connected it, so it sat inert in the handler until the next test to pin tried to
open it for real:

- PG: `NoDatabaseError: We could not find your database: db/common.sqlite3`
- MariaDB: `ER_DBACCESS_DENIED_ERROR` (payload
  `_connectionDescriptor: { name: "InMemoryModel" }`)

Fixed there by adding `InMemoryModel.removeConnection()` in the `finally`,
matching the sibling pattern already used in that same file (`BackfillModel`,
`CapturedConfigModel`, `RootConfigModel`). **That fix was one instance, found by
CI.** The file has ~20 `establishConnection` call sites and the package has ~21
test files that call it; any other that leaves a pool behind is a latent
cross-file failure that only reproduces when a fixtures suite happens to run
after it in the same worker.

Rails does not need a guard because its `teardown_fixtures` runs against a
handler its own tests keep clean, and because `ActiveRecord::TestCase` tears
connections down per-case. trails' pools are module-level state shared across
files inside a vitest worker.

## Converged shape

Audit the `establishConnection` call sites in `packages/activerecord/src/**/*.test.ts`
and give each one a matching `removeConnection()` / `removeConnectionPool()` in
its teardown, the way the already-correct sites in `connection-handling.test.ts`
do.

Then make the class non-recurring rather than relying on the next CI red: assert
in the AR suite teardown (`cases/helper.ts` — the `helper.rb` port, see
`packages/activerecord/src/cases/helper.ts`) that
`Base.connectionHandler.connectionPoolList("writing")` has returned to its
baseline membership after each file, failing the file that leaked. Report the
leaked pool's connection name so the culprit is named directly instead of the
victim.

## Acceptance criteria

- [ ] Every `establishConnection` in the AR test tree either removes its pool in
      teardown or is documented as intentionally persistent.
- [ ] A suite-level guard fails the leaking file, naming the leaked pool's
      connection descriptor.
- [ ] The guard is proven: temporarily reverting the `InMemoryModel.removeConnection()`
      fix makes it red, and it names `InMemoryModel`.
- [ ] Green on SQLite, PG and MySQL.
