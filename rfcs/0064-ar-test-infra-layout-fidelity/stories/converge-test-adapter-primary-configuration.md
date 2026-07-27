---
title: "test-adapter.ts rebuilds the sqlite config hash instead of reading CONNECTIONS"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/test-adapter.ts` builds `_primaryConfiguration` by
hand:

```ts
: { adapter: "sqlite3", database: getEnv("AR_TEST_WORKER_DB") ?? ":memory:" };
```

That is a second, independent reconstruction of what the `sqlite3` entry in
`support/test-database-config.ts` (`CONNECTIONS.sqlite3` -> `sqliteHash()`)
actually builds, and the two now disagree on all three keys: `sqliteHash()`
resolves `AR_TEST_WORKER_DB || await fallbackDatabasePath()` (a real file path,
never `":memory:"`) and, since #5398, also carries `timeout: 5000` and
`strict: true` per `config.example.yml:83-87`.

Consequences: `ambientPoolConfiguration()` and `newRawTestAdapter()` describe a
`:memory:` handle with DQS still legal, while `Base`'s pool rides a file-backed
strict-strings database. Rails has exactly one source — the `connections:` hash
in `config.example.yml` — and `connection_pool.db_config.configuration_hash`
reads from it (`test/support/connection.rb:10-19`).

Surfaced during review of #5398. `support/adapter-helper.ts` no longer consumes
`ambientPoolConfiguration()` for this reason (it reads the pool's `db_config`,
falling back to `configuredConnectionHash()`), but the divergent hash is still
live for every other caller.

## Acceptance criteria

- `test-adapter.ts` stops hand-building the sqlite branch of
  `_primaryConfiguration`; it derives from the same `CONNECTIONS` entry
  `test-database-config.ts` owns (note the async `fallbackDatabasePath()` — the
  module-load-time sync shape is the constraint to solve).
- `ambientPoolConfiguration()` and `Base.connectionPool().dbConfig.configurationHash`
  agree key-for-key on every lane.
- `newRawTestAdapter()` on the sqlite lane opens the same database `Base` rides,
  with the same `strict` / `timeout` options.
- `support/adapter-helper.ts`'s `poolConfigurationHash()` fallback can then be
  simplified or dropped if the ambient hash becomes authoritative.
