---
title: "PG and MySQL translate_exception branches pass connection_pool inline as Rails does"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6388
claim: "2026-08-11T23:46:06Z"
assignee: "converge-collection-proxy-build-record"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6384 (`pg-mysql-connection-error-branches-pass-the-exception`).
Rails passes `connection_pool: @pool` **inline on every branch** of
`translate_exception`:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:801-844`
  — e.g. `:822` `RecordNotUnique.new(message, sql: sql, binds: binds, connection_pool: @pool)`
- `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:815-856`
  — e.g. `:823` `ConnectionFailed.new(message, sql: sql, binds: binds, connection_pool: @pool)`

trails instead constructs most branches WITHOUT the pool and attaches it in a
tail block at the end of `_translateException`, via the guarded
`setPool` / `setConnectionPool` helpers:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
  `_translateException` — every `case` builds `new X(msg, { sql, binds })`,
  then the tail runs `translated.setConnectionPool(this.pool)`.
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`
  `_translateException` — same shape (the tail was moved into
  `_translateException` by #6384; the per-branch arguments were not touched).

PR #6384 converged only the connection-error branches (which now pass
`{ connectionPool: this.pool }` inline). The remaining ~25 branches across the
two adapters are the same divergence, and each is a `parity:api:calls:args`
shape row waiting to happen.

## Converged shape

Every branch passes `connectionPool: this.pool` in its own options object, as
Rails does, e.g.

```ts
case "23505": // unique_violation
  return new RecordNotUnique(msg, { sql, binds, connectionPool: this.pool });
```

With every branch supplying the pool inline, the `setPool` /
`setConnectionPool` tail block in both `_translateException` bodies becomes
dead and should be deleted — Rails has no such step, and `AdapterError#setConnectionPool`
exists only to serve it (check `parity:api:extra` / `@noRailsEquivalent` when
removing).

## Acceptance criteria

- [ ] Every branch of PG's and abstract-mysql's `_translateException` passes
      `connectionPool: this.pool` inline, cited to the Rails lines above.
- [ ] The trailing pool-attachment block is removed from both bodies once no
      branch depends on it.
- [ ] `pnpm parity:api:calls:args` green; PG and MySQL suites green.
