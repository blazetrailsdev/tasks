---
title: "PG configure_connection keeps a trails-only _connectionConfigured gate and lazy-acquire configure flag"
status: in-progress
updated: 2026-09-15
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#7787
claim: "2026-09-15T13:51:06Z"
assignee: "pg-configure-connection-retire-configured-gate"
blocked-by: null
closed-reason: null
---

## Context

After trails#7768, `PostgreSQLAdapter#configureConnection`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`) follows
Rails' body (`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:956-997`)
but keeps two trails-only pieces:

- an opening guard `if (!this._rawConnection || this._connectionConfigured) return;`
  plus the `_connectionConfigured` flag. Rails has neither: `configure_connection`
  runs exactly once per `reconnect!` (`abstract_adapter.rb:674-677`), `reset!`
  (`:726-730`) or the `@unconfigured_connection` promotion in `verify!` (`:759-776`).
- `_acquireFreshClient(configure = true)` / `_doAcquire(gen, configure)`, which
  configure on the lazy path (`awaitRawConnectionReady`). Rails' `connect`
  (`postgresql_adapter.rb:938-942`) only builds the client, and configuration
  goes through `connect!` -> `verify!` -> `reconnect!`.
- the notice receiver is attached when the client is created
  (`_attachNoticeListener`), not inside `configure_connection` (`:966-973`).

## Converged shape

`with_raw_connection` reaches an unconfigured connection through `connect!`/`verify!`,
the same way Rails does (`abstract_adapter.rb:985`). `configureConnection` has no
guard and sets up the notice receiver in its body. The `configure` flag and
`_connectionConfigured` are gone.

## Acceptance criteria

- [ ] No `_connectionConfigured` and no `configure` parameter on the acquire helpers.
- [ ] The notice receiver is attached inside `configureConnection` when `dbWarningsAction` is set.
- [ ] PG connection.test.ts, savepoint-reconnect.trails.test.ts and get-client tests green; `pnpm parity:api:calls` green.
