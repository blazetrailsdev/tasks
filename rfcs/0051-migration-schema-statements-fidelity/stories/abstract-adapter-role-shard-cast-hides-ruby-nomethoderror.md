---
title: "AbstractAdapter#role/#shard read through a cast that returns undefined where Ruby raises NoMethodError"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 150
pr: 6240
claim: "2026-08-08T15:27:57Z"
assignee: "deprecators-bucket-clusters-onto-deprecation-ts"
blocked-by: null
closed-reason: null
---

## Context

Shipped by PR #6195 (`retire-pool-less-adapters-and-delete-nullpool-role-shard`),
which deleted `NullPool#role` / `#shard` so `NullPool`'s members match
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-51`.

`AbstractAdapter#role` / `#shard`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:286-296`)
are bare unchecked sends:

```ruby
def role
  @pool.role
end

def shard
  @pool.shard
end
```

Since `pool` is typed `NullPool | ConnectionPool` and `NullPool` no longer
answers either, the port reads through a cast
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1419,1423`):

```ts
return (this.pool as ConnectionPool).role;
```

Ruby raises `NoMethodError` on a pool-less adapter; the cast returns
`undefined`. The failure mode diverges: a future pool-less construction site
would silently make an adapter look like a writing/default one instead of
failing loudly, and `inspect()` (`abstract_adapter.rb:174-181`) would render
`shard="undefined"` rather than raising.

## Converged shape

Once every adapter that is read through `role` / `shard` / `inspect()` is reached
through a real pool, `pool` narrows to `ConnectionPool` at those readers and both
bodies are the bare `this.pool.role` / `this.pool.shard` with no cast — the exact
`abstract_adapter.rb:286-296` one-liners. `AbstractAdapter`'s constructor default
`this.pool = new NullPool()` stays; it mirrors `abstract_adapter.rb:153`.

Do **not** close this by adding an `instanceof` guard that throws: that is a
branch Rails does not have in the method the call-parity gate reads. And do not
close it by retyping the field — see the 2026-08-07 findings below.

## Acceptance criteria

- [ ] `AbstractAdapter#role` / `#shard` are the bare `this.pool.role` /
      `this.pool.shard` with no cast (`abstract_adapter.rb:288,294`).
- [ ] The reader is pinned: a test asserts that reading `role` / `shard` /
      `inspect()` off a pool-less (NullPool-backed) adapter fails loudly rather
      than answering `undefined` / rendering `shard="undefined"`, which is the
      arm the cast left silent.
- [ ] The `NullPool member parity` test still passes; no test names change.

## Re-verified 2026-08-08 against `origin/main`: the prerequisite split has fully landed

The previous blocked-by said criterion 1 "is the whole story and cannot land in
one PR" and asked for a three-way split. **All of that work is now done**, and
the site list in the old body is stale. Verified site by site on `origin/main`:

| Site named in the old body                     | State on `origin/main`                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `support/schema-conn.ts:27-30`                 | **File deleted** (`retire-schemaconn-for-a-leased-connection`, PR #6217)                     |
| `test-adapter.ts:120,127,139`                  | Builds a `PoolConfig` + `ConnectionPool` and returns `pool.leaseConnection()` — real pool    |
| `support/template-global-setup.ts:120,189,313` | All three go through `pooledTemplateAdapter()`, which returns `await pool.leaseConnection()` |
| `support/second-connection.ts:20`              | Builds a `pool: 1` `ConnectionPool` and uses `pool.checkout()` / `pool.checkin()`            |
| `tasks/mysql-database-tasks.ts:154,226`        | Gone — both now `await this.connection()` off an established pool                            |
| `tasks/sqlite-database-tasks.ts:279`           | Gone — line is now `splitSqlStatements`, unrelated                                           |
| `mysql2-adapter.ts:360`                        | **Still pool-less, and correctly so** — see below                                            |

The three successor stories the old reason asked for
(`schema-conn-adapters-carry-a-real-pool`,
`raw-test-and-second-connection-adapters-carry-a-real-pool`,
`template-global-setup-adapters-carry-a-real-pool`) are all `done`, as are
`create-and-migrate-adapters-carry-a-real-pool`,
`database-tasks-adapters-carry-a-real-pool` and
`raw-test-adapters-should-come-from-pool-checkout`.

**The one surviving pool-less production construction is
`Mysql2Adapter.databaseExists` (`mysql2-adapter.ts:360`), and it must stay
pool-less**: it is the port of Rails'
`AbstractAdapter.database_exists?(config)` → `new(config).database_exists?`,
where Ruby also builds a bare, pool-less adapter for a reachability probe. It
opens a client, catches `ER_BAD_DB_ERROR`, and closes in a `finally` — it never
reads `role`, `shard` or `inspect()`. So it does not block criterion 1; it is
the Rails-faithful shape.

**So this story is now a single small PR**: delete the two casts, narrow the
readers, and pin the silent arm with a test. That is well inside the 700-LOC
ceiling — the old "cannot land in one PR" verdict was written against the
completed-split state that did not exist yet and against an older 500-LOC
ceiling. It no longer holds.

## Findings, 2026-08-07 (attempted on PR #6207, reverted before merge) — still binding

**Retyping the field is NOT a way to close this, and it was tried.** #6207
declared `pool: ConnectionPool` and moved the cast onto the `NullPool` seed at
`abstract_adapter.rb:153`'s port site, which does make the two readers bare —
acceptance criterion 1 — while changing nothing at runtime. Review blocked it,
correctly: `NullPool` still has no `role`/`shard` (`connection-pool.ts:112-130`),
`pool instanceof NullPool` still guards `close()` (`abstract-adapter.ts:1760`)
and `columnForAttribute` (`:2653`), so a pool-less adapter's `.role` still
returns `undefined`. Worse, the declared type then asserts `ConnectionPool` for
_every_ `this.pool.x` reader, so the next such reader gets no type-level signal
at all — it makes the failure mode this story exists to close **easier** to
introduce. The cast also multiplies rather than disappears: the seed, plus four
`Object.create`-built adapters in `abstract-mysql-adapter.test.ts`, plus a
downstream `dbConfig.envName as string` in `migration.ts:2597-2604` that has to
be dropped and would need restoring. Do not re-derive this arm.

The difference now is that #6207 tried to reach criterion 1 by declaration while
the construction sites were still pool-less. They no longer are. The convergence
happened at the construction sites, exactly as that review demanded, so the
readers can now narrow honestly.
