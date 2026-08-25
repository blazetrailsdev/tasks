---
title: "Stop constructing adapters that outlive a pool, so NullPool#role/#shard can go"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6195
claim: "2026-08-07T19:28:44Z"
assignee: "execute-migration-in-transaction-split-into-invented-run-migration"
blocked-by: null
closed-reason: null
---

## Context

`abstract-adapter-pool-readers-soften-rails-behaviour` (PR #6188) offered two
ways to settle the standalone-adapter path:

> either trails stops constructing adapters that outlive a pool, or the fallback
> is justified once, in one place, rather than per reader.

PR #6188 took the second. `AbstractAdapter#role` / `#shard` are now the bare
`@pool.role` / `@pool.shard` Rails has
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:286-296`),
and the fallback moved once onto `NullPool`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:155-179`):

```ts
get role(): string { return "writing"; }
get shard(): string { return "default"; }
```

Rails' `NullPool` defines neither
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-51`
— the whole class is `server_version`, `schema_reflection`, `schema_cache`,
`connection_descriptor`, `checkin`, `remove`, `async_executor`, `db_config`,
`dirties_query_cache`). So Rails raises NoMethodError there, and only never sees
it because a Ruby adapter is always reached through a pool.

This is the first option — the actual convergence, which #6188 deliberately did
not attempt because it is a much larger change than that story's scope. The
`NullPool` getters are the remaining debt: two methods Rails does not have,
existing solely because trails constructs pool-less adapters.

Known constructors of pool-less adapters (grep `new BetterSQLite3Adapter(`,
`new PostgreSQLAdapter(`, etc. outside `ConnectionPool#newConnection`): AR test
setup, the schema/CLI paths, and `AbstractAdapter`'s own constructor default
`this.pool = new NullPool()` (`abstract-adapter.ts:829-833`, which mirrors
`abstract_adapter.rb:153` and is correct — the issue is adapters that stay that
way and are then _read_ through `role`/`shard`/`inspect()`).

Related: `retire-standalone-schema-statements-construction` (RFC 0051, done) and
`converge-nullpool-protocol-retire-poolabsent-realpool` (RFC 0072, done) each
retired one class of standalone construction; this is the remaining one.

## Converged shape

No caller reads `role`/`shard` off an adapter that has no real pool, so
`NullPool#role` and `#shard` are deleted and `NullPool`'s member list matches
`connection_pool.rb:14-51` exactly.

Method: inventory the pool-less construction sites, route each through a real
pool (or through a path that never reads `role`/`shard`/`inspect`), then delete
the two getters. `inspect()` (`abstract_adapter.rb:174-181`) is the sharp edge —
it reads both and a serializer can reach it from any translated error, so it
needs a pool or its own answer.

## Acceptance criteria

- [ ] `NullPool#role` and `NullPool#shard` are deleted; the class's members match
      `connection_pool.rb:14-51`.
- [ ] No trails path constructs an adapter that outlives a pool and is then read
      through `role` / `shard` / `inspect()`.
- [ ] `abstract-adapter-preventing-writes.trails`, connection-pool,
      connection-handling and schema/CLI suites green on sqlite, PostgreSQL and
      MySQL. No test names change.
