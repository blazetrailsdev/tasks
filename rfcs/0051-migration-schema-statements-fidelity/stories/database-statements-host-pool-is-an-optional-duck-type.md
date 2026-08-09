---
title: "DatabaseStatementsHost.pool is an optional two-member duck type, not ConnectionPool|NullPool"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6268
claim: "2026-08-09T01:00:45Z"
assignee: "converge-fixture-teardown-delete-onto-a-live-connection"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `truncate-tables-duck-types-the-pool-with-literal-fallbacks`
(PR #6264), which removed that method's `?.` probes and literal fallbacks.

`DatabaseStatementsHost` (`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:168`)
still declares its pool as an optional ad-hoc structural type:

```ts
pool?: { schemaMigration: { tableName: string }; internalMetadata: { tableName: string } };
```

Rails' host is an `AbstractAdapter`, whose `@pool` is a real
`ConnectionPool` or `NullPool` and is never absent — `abstract_adapter.rb:153`
assigns `NullPool.new` in `initialize`, and trails matches that at
`abstract-adapter.ts:833`/`:878`. So the `?` describes no adapter that exists;
it only describes the mock host literals in
`database-statements.test.ts`, and it forced `truncateTables` to spell its
requirement as a `this`-type intersection
(`& { pool: NonNullable<DatabaseStatementsHost["pool"]> }`) rather than simply
reading `this.pool`.

The two-member structural shape is the second half: it names only the two
readers `truncate_tables` happens to use, so a host can satisfy the type while
being nothing like a pool, and the `NoMethodError` a pool-less adapter should
raise arrives as a TypeError on `undefined` instead.

## Converged shape

`DatabaseStatementsHost.pool` typed non-optionally as
`ConnectionPool | NullPool` (the type `AbstractAdapter#pool` already carries),
`truncateTables`'s `this` intersection dropped so the body reads `this.pool`
bare against the declared member, and the ~25 mock host literals in
`database-statements.test.ts` given a real pool — `support/pooled-sqlite-adapter.ts`
is the sanctioned source, per the parent story's "callers reaching it with a
pool-less adapter get a real `ConnectionPool`, never a re-added NullPool
member".

Rails: `connection_adapters/abstract/database_statements.rb:222-223`,
`connection_adapters/abstract_adapter.rb:153`,
`connection_adapters/abstract/connection_pool.rb:24-48`.

## Acceptance criteria

- [ ] `DatabaseStatementsHost.pool` is non-optional and typed as the real pool
      union, not a two-member structural shape.
- [ ] `truncateTables` drops its `this`-type intersection and reads
      `this.pool.schemaMigration.tableName` / `.internalMetadata.tableName`
      against the declared member.
- [ ] The mock hosts in `database-statements.test.ts` hold a real pool; no
      bespoke pool literal is reintroduced.
- [ ] `pnpm typecheck` green; no new baseline rows or allowlist entries.
