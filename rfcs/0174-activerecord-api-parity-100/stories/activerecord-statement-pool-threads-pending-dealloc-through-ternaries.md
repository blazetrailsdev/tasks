---
title: "activerecord: StatementPool#[]=, #clear and #delete thread a pending dealloc through ternaries Rails does not have"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-3`, which converged `StatementPool#cache` (now a `Hash` with Rails' default block) and left three rows in `pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/statement-pool.ts#set` — `+if`
- `connection-adapters/statement-pool.ts#clear` — `+if`
- `connection-adapters/statement-pool.ts#delete` — `+if`

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/statement_pool.rb:28-52`) calls `dealloc` in line: `dealloc(cache.shift.last)` in a `while`, `cache.each_value { |stmt| dealloc stmt }`, and `if stmt = cache.delete(key); dealloc(stmt); end`.

In trails `dealloc` returns `void | Promise<void>` (SQLite closes a statement synchronously, PostgreSQL and MySQL send a `DEALLOCATE`), and each of the three bodies threads that with a ternary Rails has no counterpart for: `deallocating ? deallocating.then(...) : this.dealloc(...)` in `set` and `clear`, `pending ? pending.then(() => stmt) : stmt` in `delete`.

Making the three `async` is not available as it stands, which is the blocker to resolve here:

- `AbstractAdapter#clearCacheBang` (`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1466-1471`) runs `this._statements.clear()` inside `lock.synchronize` and is called unawaited; an `async clear()` would leave the cache populated until a microtask later, handing a closed statement to the next `get`.
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` calls `void this._statements.set(sql, stmt)` and `packages/activerecord/src/connection-adapters/mysql2/database-statements.ts:181` calls `this._statements?.delete(sql)` without awaiting, for the same reason.

So the cache mutation has to stay synchronous while the deallocation may be pending. The convergence is to give that one home — the body calls `dealloc` once per statement as Rails does, and whatever sequences a pending one lives outside these three bodies — or to make every caller await.

`set` also carries `@missingRailsCall last — PERMANENT` / `@missingRailsName last — PERMANENT` for `cache.shift.last`; `Hash#shift` exists in `@blazetrails/ruby-compat` (`packages/ruby-compat/src/hash.ts:821`) and `_cache`'s inner maps can become `Hash`es, so re-check whether those two receipts are still needed.

## Acceptance criteria

- [ ] `set`, `clear` and `delete` carry Rails' arms only: one `while`, one `each_value` loop, one `if stmt = cache.delete(key)`.
- [ ] An unawaited `clearCacheBang()` still leaves the pool empty before it returns.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no row for `connection-adapters/statement-pool.ts`.
