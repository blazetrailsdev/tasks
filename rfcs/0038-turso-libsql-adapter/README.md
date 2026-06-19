---
rfc: "0038-turso-libsql-adapter"
title: "Turso / libSQL SQLite driver (beyond-parity extension)"
status: closed
created: 2026-06-19
updated: 2026-06-19
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "adapter-test-fidelity"
---

# RFC 0038 — Turso / libSQL SQLite driver (beyond-parity extension)

## Summary

Add a **libSQL** driver to the ActiveRecord SQLite adapter so trails apps can
use **libSQL** (the open-source SQLite fork that powers Turso) as a **local-file**
SQLite backend. libSQL's JS client (`libsql`, aka libsql-js) is deliberately
**better-sqlite3 API-compatible**, so it slots into trails' existing pluggable
SQLite **driver abstraction** with no changes to the SQLite dialect core.

**Shipped in PR #3664.** The local-file driver, adapter subclass, registration,
and tests are merged; the `libsql` adapter is usable today.

**Scope: local-file is the supported, tested path.** The libsql driver behaves
as a drop-in alternate local SQLite backend alongside `better-sqlite3` and
`node:sqlite`. Remote (Turso Cloud) / embedded-replica options (`authToken`,
`syncUrl`) are **configurable** — the driver spreads `config.driverOptions`
straight into `new Database(database, options)`, so a caller can set them — but
they are explicitly **not a tested or supported feature**: no networked tests,
no CI lane, no dedicated code path, best-effort pass-through only.

## Motivation

trails already supports multiple SQLite client libraries behind one adapter via
the `SqliteDriver` seam (`packages/activerecord/src/sqlite-adapter.ts`):
`better-sqlite3` (default), `node:sqlite`, and `expo-sqlite`. Each is a small
driver (`sqlite/*.ts`) plus a thin `AbstractSQLite3Adapter` subclass
(`connection-adapters/*-adapter.ts`) registered in `connection-adapters.ts`.
libSQL is the natural next driver: it is better-sqlite3-shaped for local use, so
it drops into that same shape as another local SQLite backend.

## Fidelity framing

Rails core has **no** Turso adapter, and the SQLite driver-abstraction is
itself already a trails-specific extension beyond Rails (Rails' `sqlite3`
adapter only uses the `sqlite3` Ruby gem). This RFC is therefore an explicit
**beyond-parity extension**, in the same spirit as the existing
`node-sqlite`/`expo-sqlite` drivers. Crucially it **reuses
`AbstractSQLite3Adapter` unchanged**, so it does not perturb `api:compare` /
`test:compare` for the canonical `sqlite3` adapter, and adds no Rails-mismatch
debt to the parity gate.

## What shipped

A **new driver + thin adapter subclass + registration**, mirroring the
`node-sqlite`/`expo-sqlite` precedent. The driver contract (`SqliteDriver` /
`SqliteConnection` / `SqliteStatement` in `sqlite-adapter.ts`) is bytes-in /
rows-out and opaque to query construction, so the dialect, quoting, and schema
logic in `AbstractSQLite3Adapter` are reused verbatim.

Files added in PR #3664:

- `packages/activerecord/src/sqlite/libsql.ts` — `libsqlDriver: SqliteDriver`
  wrapping `import Database from "libsql"` (sync). `LibsqlStatement` /
  `LibsqlConnection` mirror the better-sqlite3 driver
  (`run/get/all/iterate/columns/setReadBigInts(safeIntegers)`). Capabilities:
  `inProcessSync: true`, `loadExtension: false`, `foreignKeysOnByDefault: false`.
  `databaseExists` does an fs check; `restoreFromPath` tries libsql's `backup()`
  and falls back to an async file clone (the local build throws on `backup()`).
- `packages/activerecord/src/connection-adapters/libsql-adapter.ts` —
  `LibSQLAdapter extends AbstractSQLite3Adapter`, returns `libsqlDriver`.
- `packages/activerecord/src/sqlite/libsql.test.ts` — driver tests.
- Registered as `"libsql"` in `connection-adapters.ts`; `libsql` added as an
  optional peer dep with a subpath export.

Local construction uses the sync path: `new Database(path)`. Remote/replica
options ride the generic `driverOptions` pass-through in `openDatabase()` — no
async-open wiring (`AbstractSQLite3Adapter.openAsync()`) was added.

## Key facts about the `libsql` package

- `import Database from "libsql"` — sync, better-sqlite3-shaped (`prepare`,
  `exec`, `pragma`, `transaction`, `.run/.get/.all/.iterate`, `.columns()`,
  `safeIntegers()`).
- Local: `new Database("app.db")`; in-memory: `new Database(":memory:")`.
- Inherits SQLite's single-writer model. The local build throws on `backup()`
  and disables `loadExtension`.
- Remote/embedded-replica constructors (`{ authToken }`, `{ syncUrl }`) are
  supported by the package; trails passes them through via `driverOptions` but
  does not test or actively support them.

## Stories

1. **libsql-local-driver** — local-file driver + thin subclass + registration
   - optional dep. Shipped in PR #3664. The whole supported RFC.

Remote and embedded-replica were originally drafted as follow-on stories but
**dropped**: remote is configurable via the `driverOptions` pass-through (no
dedicated work), and we are not supporting networked Turso out of the box.

<!-- generated: stories table -->

| ID                                                    | Title                                                       | Status | Est LOC | Cluster               |
| ----------------------------------------------------- | ----------------------------------------------------------- | ------ | ------- | --------------------- |
| [libsql-local-driver](stories/libsql-local-driver.md) | libsql: local-file driver + adapter subclass + registration | done   | 220     | adapter-test-fidelity |

## Open questions

Resolved by PR #3664:

1. `libsql` API surface verified against the contract — `backup()` throws on the
   local build (file-clone fallback used), `columns()`/`safeIntegers` behave as
   better-sqlite3.
2. `loadExtension` is off (`capabilities.loadExtension: false`); extension-
   dependent tests are gated accordingly.

## References

- [libsql-js (better-sqlite3-compatible API)](https://github.com/tursodatabase/libsql-js)
- [@libsql/client (npm)](https://www.npmjs.com/package/@libsql/client)
