---
title: "PostgreSQLAdapter's raw-connection constructor arm takes a PG::Connection, not a pg.Client"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: migration
packages: ["activerecord"]
deps:
  - "pg-connection-exec-surface-moves-to-the-package"
  - "pg-connection-status-cancel-block-move-to-the-package"
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:541-562` has a constructor overload taking a raw `pg.Client`
(`constructor(rawConnection: pg.Client, deprecatedConfig?)`), which calls
`_attachReadyForQueryListener(config as pg.Client)` (`:562`). Rails' `initialize(...)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:318-341`) defers to `AbstractAdapter#initialize`, whose deprecated
positional form takes the driver's connection object: a `PG::Connection`.

`pg-connection-exec-surface-moves-to-the-package` types the `_rawConnection` field and `newClient`
and deliberately leaves the rest; `pg-connection-status-cancel-block-move-to-the-package` deletes
the listener the overload calls. This story owns every remaining node-pg type in the adapter file.

After the connection stories, `PostgreSQLAdapter` holds a `PG.Connection`; a caller passing a
node-pg client is the last place the npm type reaches the adapter's public surface. Also
`_rawConnectionForTest(): pg.Client | null` (`:1871`) and `_pgClientOptions: pg.ClientConfig`
(`:424`).

## Acceptance criteria

- [ ] The raw-connection constructor arm accepts a `PG.Connection`. Tests that built a `pg.Client` by hand build `await PG.connect(...)` instead; list the files in the PR body.
- [ ] `grep -n "pg\.Client\|pg\.PoolConfig\|pg\.ClientConfig" packages/activerecord/src/connection-adapters/postgresql-adapter.ts` returns nothing; conn-param types come from the package.
- [ ] `_rawConnectionForTest` returns the `PG.Connection`.
- [ ] `pnpm vitest run scripts/mixin-declaration-drift.test.ts` is green. It compares each adapter's signatures against the `interface AbstractAdapter` mixin declarations, parameter names and type-alias spellings included, so a changed constructor or accessor type must be mirrored there.

## Verification

```bash
pnpm vitest run packages/activerecord/src/connection-adapters/postgresql && pnpm vitest run scripts/
```
