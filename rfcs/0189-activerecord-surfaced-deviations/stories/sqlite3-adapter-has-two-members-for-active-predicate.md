---
title: "activerecord: SQLite3Adapter answers active? with two members, isActive and active"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
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

Surfaced by trails#8847. Rails' `SQLite3Adapter#active?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:210-215`)
is one method: `if connected?; verified!; true; end`.

trails' `SQLite3Adapter` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) has two
members for it:

- `isActive(): boolean | undefined`, synchronous, holding Rails' body. `parity:api` pairs Rails'
  `active?` with this one.
- `active(): Promise<boolean>`, the override of `AbstractAdapter#active` that `verifyBang` awaits. Since
  trails#8847 it is `this.lock.synchronize(async () => this.isActive() ?? false)`, the lock ruled by the
  repo owner on 2026-10-11 (`packages/activerecord/CLAUDE.md` § "The adapter lock defaults to a monitor,
  not `NullLock`").

`PostgreSQLAdapter` and `Mysql2Adapter` have `active()` only, which is what `active?` pairs with there.

Because `active` is not the compared declaration on SQLite, the lock arm it adds can carry no receipt:
`pnpm parity:api:arms:throws` rejects `@inventedArm synchronize` on it ("declaration not compared"), and
`pnpm parity:api:extra` rejects `@noRailsEquivalent` as redundant. The arm is recorded only in the
package `CLAUDE.md`.

Synchronous `isActive()` callers: `adapters/sqlite3/sqlite3-adapter.test.ts:187,194`,
`adapters/sqlite3/sqlite3-adapter-perform-query.trails.test.ts:199,206,229` (`:199` reads it while the
adapter lock is held by another entry, so a locked `active()` cannot stand in there) and
`sqlite-adapter.trails.test.ts:614`.

## Converged shape

One member, `active()`, holding Rails' body under `lock.synchronize` as the PostgreSQL and Mysql2 ports
do, receipted `@inventedArm synchronize — PERMANENT` now that it is the compared declaration. `isActive`
is deleted and its callers await `active()`. The `:199` test asserts on `isConnected()` or is rewritten
so it does not need an unlocked peek.

## Acceptance criteria

- [ ] `SQLite3Adapter` has no `isActive`; `active?` pairs with `active` in `parity:api`.
- [ ] `active` carries `@inventedArm synchronize — PERMANENT` and `pnpm parity:api:arms:throws`,
      `pnpm parity:api:extra` and `pnpm parity:api:predicates` are green.
- [ ] `adapters/sqlite3/**`, `sqlite-adapter.trails.test.ts` and `connection-pool.trails.test.ts` pass on SQLite.
