---
title: "pg: a PGlite engine behind PG::Connection, for an in-browser PostgreSQL"
status: closed
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: connection
packages: ["pg", "website"]
deps: ["pg-connection-session-setters-move-to-the-package", "pg-text-decoders-move-to-the-package"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "owner decision 2026-10-08: PGlite is out of RFC 0186; an in-browser PostgreSQL is its own RFC when the website needs one"
---

## Context

One reason for the package is that a second client can implement the same surface. PGlite
(`@electric-sql/pglite`) runs PostgreSQL in WASM, in-process, with `query(sql, params, opts)`,
`exec(sql)` and `transaction(fn)`.

Do not start until RFC 0186-pg-gem-port open question 4 is answered: it decides whether this is
a second engine in `packages/pg` or a separate package, and whether it is in this RFC at all.

Against the surface table, PGlite has no wire, so three methods have nothing to act on:
`cancel` (`vendor/pg/v1.5.9/lib/pg/connection.rb:597`), `block` (`vendor/pg/v1.5.9/ext/pg_connection.c:4610`) and
`socket_io` (`:4525`). Everything else maps: results carry `fields[].dataTypeID`; errors are
`DatabaseError`-shaped with `code`; `server_version` is a `SHOW` at open, cached.

## Acceptance criteria

- [ ] A probe, written up in the PR body before any code: for each row of the surface table, what PGlite offers, verified by running it, including whether a named prepared statement can be driven (`prepare` / `exec_prepared`) or the adapter must run with `prepared_statements: false`.
- [ ] `packages/pg` gains a `./pglite` export whose `PG.connect`-shaped entry builds a `PG.Connection` over PGlite; `@electric-sql/pglite` is an optional peer.
- [ ] `cancel`, `block` and `socketIo` on that engine do what libpq does when there is nothing in flight (`block` returns, `cancel` is a no-op returning nil, `socket_io` raises as libpq does for an invalid socket), each cited to the C.
- [ ] The `packages/pg` suite runs against both engines; the cases that cannot pass on PGlite are skipped by name with the reason.
- [ ] A `packages/website` test establishes a `postgresql` connection through PGlite and runs one migration and one query.

## Verification

```bash
pnpm vitest run packages/pg
```
