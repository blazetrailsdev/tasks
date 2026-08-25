---
title: "SchemaMigration/InternalMetadata cast away the NullPool arm to reach withConnection and schemaCache"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6270
claim: "2026-08-09T01:30:48Z"
assignee: "port-sqlite-rake-create-drop-charset-collation-tests"
blocked-by: null
closed-reason: null
---

## Context

`migration-collaborator-call-sites-pass-a-pool` (PR #6261) narrowed
`SchemaMigration` and `InternalMetadata` to hold only a
`ConnectionPool | NullPool`, matching Ruby (`schema_migration.rb:14-17`,
`internal_metadata.rb:18-21`). Both classes then reach the pool through
structural casts that assert away the `NullPool` arm:

- `schema-migration.ts:65` — `return await (this._pool as ConnectionPool).withConnection(fn);`
- `internal-metadata.ts:99` — the same line.
- `internal-metadata.ts:229-231` —

  ```ts
  const schemaCache = (this._pool as ConnectionPool).schemaCache as {
    dataSourceExists(name: string): Promise<boolean | undefined>;
  };
  ```

  a second cast, this one restating a slice of `BoundSchemaReflection`
  (`schema-cache.ts:971`, `dataSourceExists` at `:1015`) rather than naming it.

The runtime behaviour is correct and matches Ruby: `NullPool` defines no
`with_connection` and no `schema_cache` that answers, so a pool-less
collaborator raises `NoMethodError` on the send, exactly as
`abstract/connection_pool.rb:14-51` does. The casts are a **type-level** lie —
they tell the compiler the raising arm cannot happen while the whole point of
the `NullPool` member of the union is that it can.

This is the shape `retire-structural-casts-in-deprecator-migration-proxy`
(0051, done) retired elsewhere in the same cluster; it is debt, not permission.

## Converged shape

Type the reads so the `NullPool` arm is visible rather than asserted away:

- Prefer narrowing (`this._pool instanceof NullPool` / a discriminant) so the
  raising arm is expressed in the type, matching Ruby's "the send just raises".
- `schemaCache` should be typed as `BoundSchemaReflection` from
  `schema-cache.ts`, imported, not restated as an inline structural literal.
- No `as` on the happy path.

Note `AbstractPool` already declares `get schemaCache(): unknown` (`:57`) and
`NullPool` declares `get schemaCache(): null` (`:67`) — the union's shape is the
thing to fix, and widening `AbstractPool` beyond what Rails' NullPool answers is
not the answer (see the `role`/`shard` `declare … never` note at
`connection-pool.ts:121-131` for the settled treatment of exactly this problem).

## Acceptance criteria

- [ ] No `as ConnectionPool` in `schema-migration.ts` or `internal-metadata.ts`.
- [ ] `schemaCache` is read at its real type, not an inline structural literal.
- [ ] A `NullPool`-backed collaborator still raises `NoMethodError` on
      `withConnection` / `tableExists` — the guard the story
      `migration-collaborator-call-sites-pass-a-pool` relies on so a site that
      accidentally kept a `NullPool` fails loudly rather than silently
      disabling itself.
- [ ] No new baseline rows or allowlist entries.
