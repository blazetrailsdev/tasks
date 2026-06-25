---
rfc: "0038-turso-libsql-adapter"
title: "Turso / libSQL SQLite driver (beyond-parity extension)"
status: closed
created: 2026-06-19
updated: 2026-06-23
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "adapter-test-fidelity"
---

# RFC 0038 — Turso / libSQL SQLite driver (beyond-parity extension)

## Summary

Add a **libSQL** driver to the ActiveRecord SQLite adapter so trails apps can
target **Turso** (the managed libSQL service) in all three libSQL connection
modes: local file, remote (Turso Cloud), and embedded replica. libSQL is an
open-source SQLite fork; its JS client (`libsql`, aka libsql-js) is
deliberately **better-sqlite3 API-compatible**, so it slots into trails'
existing pluggable SQLite **driver abstraction** with no changes to the SQLite
dialect core.

## Motivation

trails already supports multiple SQLite client libraries behind one adapter via
the `SqliteDriver` seam (`packages/activerecord/src/sqlite-adapter.ts`):
`better-sqlite3` (default), `node:sqlite`, and `expo-sqlite`. Each is a small
driver (`sqlite/*.ts`) plus a thin `AbstractSQLite3Adapter` subclass
(`connection-adapters/*-adapter.ts`) registered in `connection-adapters.ts`.
Turso/libSQL is the natural next driver: it is better-sqlite3-shaped for local
use and adds remote + embedded-replica modes that no current driver offers
(local-first reads with cloud-synced writes).

## Fidelity framing

Rails core has **no** Turso adapter, and the SQLite driver-abstraction is
itself already a trails-specific extension beyond Rails (Rails' `sqlite3`
adapter only uses the `sqlite3` Ruby gem). This RFC is therefore an explicit
**beyond-parity extension**, in the same spirit as the existing
`node-sqlite`/`expo-sqlite` drivers. Crucially it **reuses
`AbstractSQLite3Adapter` unchanged**, so it does not perturb `api:compare` /
`test:compare` for the canonical `sqlite3` adapter, and adds no Rails-mismatch
debt to the parity gate.

## Design

The integration is a **new driver + thin adapter subclass + registration**,
mirroring the `node-sqlite`/`expo-sqlite` precedent. The driver contract
(`SqliteDriver` / `SqliteConnection` / `SqliteStatement` in `sqlite-adapter.ts`)
is bytes-in / rows-out and opaque to query construction, so the dialect,
quoting, and schema logic in `AbstractSQLite3Adapter` are reused verbatim.

Connection modes map to existing construction paths:

- **Local file** — `new Database(path)`; sync API is better-sqlite3-compatible,
  so `openSync()` is supported (eager connect in the sync constructor, like
  better-sqlite3).
- **Remote** — `new Database(url, { authToken })`; network-backed, so omit
  `openSync()` for remote configs and use the **async** path already wired for
  expo-sqlite (`AbstractSQLite3Adapter.openAsync()` / `completeAsyncConnect()`).
- **Embedded replica** — `new Database(localPath, { syncUrl, authToken })` plus
  a caller-driven `sync()` operation.

The work splits into three sequential stories:

1. **libsql-local-driver** — local-file driver + thin subclass + registration
   - optional dep. The MVP; standalone.
2. **libsql-remote-mode** — remote URL + `authToken`, async-open dispatch,
   config plumbing. Depends on story 1.
3. **libsql-embedded-replica** — `syncUrl` replica mode + caller-driven
   `sync()`. Depends on story 2.

## Key facts about the `libsql` package

- `import Database from "libsql"` — sync, better-sqlite3-shaped (`prepare`,
  `exec`, `pragma`, `transaction`, `.run/.get/.all/.iterate`, `.columns()`,
  `safeIntegers()`). `libsql/promise` is the async variant.
- Local: `new Database("app.db")`; in-memory: `new Database(":memory:")`.
- Remote: `new Database(url, { authToken })`.
- Embedded replica: `new Database("local.db", { syncUrl, authToken })` +
  `db.sync()`.
- Inherits SQLite's single-writer model. No remote `backup()` primitive;
  `loadExtension` is unavailable on remote.

## Open questions

1. Verify the installed `libsql` version's API surface (esp. `backup()`,
   `columns()` metadata fidelity, `safeIntegers`/bigint behavior) against the
   `SqliteStatement`/`SqliteConnection` contract before finalizing story 1.
2. libsql disables `loadExtension`; collation/virtual-table tests in
   `adapters/sqlite3/` that rely on extensions must be capability-gated or
   excluded for the libsql driver.
3. Periodic embedded-replica sync ownership: caller-driven (`adapter.syncReplica()`)
   first; defer adapter-owned auto-sync timer.

## References

- [libsql-js (better-sqlite3-compatible API)](https://github.com/tursodatabase/libsql-js)
- [@libsql/client (npm)](https://www.npmjs.com/package/@libsql/client)
- [Turso JS/TS SDK docs](https://docs.turso.tech/libsql/client-access/javascript-typescript-sdk)
