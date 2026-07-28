---
title: "isPreventingWrites pools inject a zero-arg adapter that ignores the declared db_config"
status: done
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 35
priority: null
pr: 5494
claim: "2026-07-28T12:52:18Z"
assignee: "prevent-writes-pools-adapter-ignores-db-config"
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #5286 (connection-handling-ambient-connection), which converted
`connection-handling.test.ts` off `:memory:` everywhere except five sites in the
`AbstractAdapter#isPreventingWrites stack matching` describe
(connection-handling.test.ts ~611-717).

Those five pools are established with an injected zero-arg factory:

```ts
Base.connectionHandler.establishConnection(
  new HashConfig("test", "AnimalsRecord", { adapter: "sqlite3", database: ":memory:" }),
  { owner: "AnimalsRecord", role: "writing", adapterFactory: () => new BetterSQLite3Adapter() },
);
```

`new BetterSQLite3Adapter()` takes `filenameOrConfig = ":memory:"` as its
default (connection-adapters/sqlite3-adapter.ts:357) and never reads the
`HashConfig`'s `database`, so the declared database is inert — the pool opens
`:memory:` no matter what the config says. PR #5286 initially renamed these to
`db/animals.sqlite3` etc. and reverted, because a file path there claims a
file-backed pool that does not exist.

Rails' pool builds its adapter from `db_config`; a pool whose adapter ignores
its own `db_config` has no Rails counterpart. These tests only need
prevent-writes stack matching, so the cheapest honest fix may be to drop the
`adapterFactory` override and let the pool construct from the config.

Related: `audit-residual-memory-sites` (blocked) will hit these same five sites.

## Acceptance criteria

- [ ] The five `isPreventingWrites` pools either build their adapter from the
      declared `HashConfig` (so config and reality agree), or stop declaring a
      database the factory ignores.
- [ ] If they become genuinely file-backed, the paths point at a directory that
      exists and are cleaned up — no relative `db/` writes into the repo root,
      no cross-worker collisions.
- [ ] Test names unchanged; all three lanes green.
