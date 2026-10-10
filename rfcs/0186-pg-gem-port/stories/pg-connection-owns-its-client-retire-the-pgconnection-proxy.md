---
title: "PG::Connection owns its client: retire the pgConnection Proxy wrapper"
status: draft
updated: 2026-10-10
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
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

`packages/activerecord/src/pg/connection.ts:321-326` (`pgConnection`) wraps a node-pg client in a
`Connection` holder behind a `Proxy` (`HANDLER`, `:303-319`) that forwards every name the holder
does not define to the current `client`. trails#8743 introduced the holder so `reset` can swap the
client instead of rewriting node-pg's private state. The Proxy is there only because callers still
reach node-pg members (`query`, `on`, `connection`, `escapeIdentifier`, …) through the connection.

The gem has no such forwarding. `PG::Connection` is allocated with its own `PGconn`
(`vendor/pg/v1.5.9/ext/pg_connection.c:252`, `:277`, `:326`) and defines no `method_missing`; every
method a caller uses is a method of the class.

Two consequences today:

- `pgConnection(client)` called twice on the same raw client builds two holders with separate
  `prepared`, `readyForQuery` and `typeMapForResults`, and attaches the client listeners twice.
  Only `client instanceof Connection` is short-circuited. No caller does this now. Callers:
  `connection-adapters/postgresql-adapter.ts`, `pg/connection.trails.test.ts`,
  `adapters/postgresql/bytea.trails.test.ts`, `connection-adapters/postgresql/quoting.trails.test.ts`,
  `connection-adapters/postgresql/pg-text-decoder.trails.test.ts`,
  `connection-adapters/postgresql-adapter.exec-query.trails.test.ts`.
- The Proxy is absent from the protocol-methods table in the root `CLAUDE.md`
  ("Ruby protocol methods with a different JS mechanism"), which lists every sanctioned Proxy by
  Rails file. It has no Ruby `method_missing` behind it, so it does not belong there; it is debt.

## Converged shape

`Connection` owns its client: it is built from conn params (`PG.connect(conn_params)`), nothing
wraps a caller-supplied node-pg client, and every member a caller uses is a `Connection` method
at its gem name. `pgConnection` and `HANDLER` are deleted, which removes the double-wrap case with
them. Do not add a `WeakMap` client→holder cache; that keeps the wrapper.

## Acceptance criteria

- [ ] `grep -n "new Proxy\|HANDLER\|export function pgConnection" packages/activerecord/src/pg/connection.ts` returns nothing.
- [ ] No source or test file calls `pgConnection(`; tests build a `Connection` from conn params.
- [ ] `Connection#reset` still replaces its client and raises `PG::ConnectionBad` on a failed reconnect; `pg/connection.trails.test.ts` and `postgresql-adapter.trails.test.ts` stay green.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:arms:throws` are green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/pg packages/activerecord/src/connection-adapters/postgresql-adapter.trails.test.ts
```
