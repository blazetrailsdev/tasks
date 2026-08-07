---
title: "AbstractAdapter#role/#shard read through a cast that returns undefined where Ruby raises NoMethodError"
status: ready
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
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
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1406-1416`):

```ts
return (this.pool as ConnectionPool).role;
```

Ruby raises `NoMethodError` on a pool-less adapter; the cast returns
`undefined`. The failure mode diverges: a future pool-less construction site
would silently make an adapter look like a writing/default one instead of
failing loudly, and `inspect()` (`abstract_adapter.rb:174-181`) would render
`shard="undefined"` rather than raising. PR #6195 verified no current caller
reaches `role` / `shard` / `inspect()` on a pool-less adapter, and pinned the
`NullPool` member list with a `NullPool member parity` test in
`connection-pool.trails.test.ts`, but the cast's silent arm is unpinned.

The remaining pool-less construction sites are `test-adapter.ts:120,127,139`,
`support/schema-conn.ts:27-30`, `support/template-global-setup.ts:120,189,313`,
`support/second-connection.ts:20`, `tasks/mysql-database-tasks.ts:154,226`,
`tasks/sqlite-database-tasks.ts:279`, and `mysql2-adapter.ts:360`. (`create-and-migrate-adapters-carry-a-real-pool` owns the task/CLI subset;
this story owns closing the reader.)

## Converged shape

Once every adapter that is read through `role` / `shard` / `inspect()` is reached
through a real pool, `pool` narrows to `ConnectionPool` at those readers and both
bodies are the bare `this.pool.role` / `this.pool.shard` with no cast — the exact
`abstract_adapter.rb:286-296` one-liners. `AbstractAdapter`'s constructor default
`this.pool = new NullPool()` stays; it mirrors `abstract_adapter.rb:153`.

Do **not** close this by adding an `instanceof` guard that throws: that is a
branch Rails does not have in the method the call-parity gate reads. The
convergence is at the construction sites, not in the reader.

## Acceptance criteria

- [ ] No trails path constructs an adapter that outlives a pool and is then read
      through `role`, `shard` or `inspect()`, with the remaining sites from the
      list above routed through a real pool.
- [ ] `AbstractAdapter#role` / `#shard` are the bare `this.pool.role` /
      `this.pool.shard` with no cast (`abstract_adapter.rb:288,294`).
- [ ] The `NullPool member parity` test still passes; no test names change.
