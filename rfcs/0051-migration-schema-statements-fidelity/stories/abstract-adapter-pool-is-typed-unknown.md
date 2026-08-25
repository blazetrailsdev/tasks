---
title: "AbstractAdapter#pool is declared unknown, forcing casts at every pool reader and call site"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6128
claim: "2026-08-05T14:47:37Z"
assignee: "resolve-last-activerecord-inheritance-mismatch-schema-dumper"
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter#pool` is declared `pool: unknown = null`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:852`) and
planted as a `NullPool` in the constructor (`:808`, mirroring
`abstract_adapter.rb:153`). Rails' `@pool` is a real `ConnectionPool` or a
`NullPool`, and every reader — `AbstractAdapter#role`, `#shard`, `#inspect`,
`#replica?` — just calls methods on it.

Because the TS type is `unknown`, every one of those readers casts on the spot:
`(this.pool as any)?.role` (`:1381`), `(this.pool as any)?.shard` (`:1385`),
`this.pool as { dbConfig?: { envName?: string; name?: string } } | null`
(`:1396`), `(this.pool as any)?.dbConfig?.replica` (`:1456`),
`const pool = this.pool as any` (`:1466`).

This blocks the pool-threading stories rather than merely being untidy.
Attempting `internal-metadata-takes-a-pool-nullpool-arm-reads-enabled` on
branch `date-initialize-guess-style-fast-path-d501` (PR #6127) showed that
converting `InternalMetadata` to take a pool (`internal_metadata.rb:18-21`)
forces `as ConnectionPool` at all ~30 `new InternalMetadata(adapter.pool)`
sites purely because of this declaration, which is why that story is now
`blocked`. `migration-context-collaborators-need-a-pool` will hit the same wall.

## Converged shape

`pool` is typed as the pool surface Rails' `@pool` actually is — the union of
`ConnectionPool` and `NullPool`, or the `AbstractPool` interface both already
implement (`connection-adapters/abstract/connection-pool.ts:112`) — so
`adapter.pool` is assignable to a pool parameter without a cast, and the five
`as any` / structural casts in `abstract-adapter.ts` are deleted rather than
relocated.

Note the trap the casts hide: a `NullPool` answers `NULL_CONFIG`
(`connection-pool.ts:62,155`), whose every key is undefined — Rails'
`NullConfig#method_missing` returning nil
(`abstract/connection_pool.rb:17-22`). Typing the field will make the readers
that currently soften an absent value (`?? "writing"`, `!== false`) fail to
compile or change meaning; each one is its own faithfulness question against
its Rails counterpart and should be resolved against the .rb, not silenced.

## Acceptance criteria

- [ ] `AbstractAdapter#pool` has a pool type, not `unknown`.
- [ ] The casts at `abstract-adapter.ts:1381`, `:1385`, `:1396`, `:1456`,
      `:1466` are deleted, not moved.
- [ ] `adapter.pool` passes to a `ConnectionPool`/`AbstractPool` parameter with
      no cast at the call site.
- [ ] Every reader whose softening the new type exposes is decided against its
      Rails counterpart and cited there.
- [ ] Unblocks `internal-metadata-takes-a-pool-nullpool-arm-reads-enabled`;
      no behavior change in this story.
