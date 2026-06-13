---
title: "Async SQLite adapter constructor path: enable expo-sqlite / async-only drivers"
status: done
updated: 2026-06-13
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 14
pr: 3190
claim: "2026-06-13T13:08:10Z"
assignee: "sqlite-async-constructor-path"
blocked-by: null
---

## Context

Follow-up surfaced in PR #3142 (`sqlite3-adapter-subclasses-registry-removal`).

`AbstractSQLite3Adapter`'s constructor opens the connection synchronously via the
driver's `openSync()` hook (`connect()` in
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, ~line 2240:
`if (!factory.openSync) throw "...does not support sync open()"`). The
`SqliteDriver` interface intentionally exposes both `open()` (async) and an
optional `openSync()` as a bridge until the async constructor path lands (see
the `@internal` notes on `openSync`/`SyncSqliteConnection` in
`packages/activerecord/src/sqlite-adapter.ts`).

Consequence: drivers that only implement async `open()` — `expo-sqlite` today,
`wa-sqlite` and other WASM/network-backed drivers in future — can never be
constructed. Because of this, PR #3142 deliberately did **not** register
`expo-sqlite` as an openable adapter, and dropped it from the `ar new` /
trailties app + devcontainer generators. The `ExpoSQLiteAdapter` class and its
`@blazetrails/activerecord/connection-adapters/expo-sqlite-adapter.js` package
export ship ready for re-enablement. `better-sqlite3` and `node:sqlite` are
unaffected (both implement `openSync()`).

## Acceptance criteria

- [ ] Add an async adapter construction/connection path so adapters backed by an
      async-only `SqliteDriver.open()` can establish a connection (without
      requiring `openSync()`).
- [ ] Re-register `expo-sqlite` → `ExpoSQLiteAdapter` by `adapter:` name in
      `connection-adapters.ts`; restore it to `normalizeAdapterName()` and the
      trailties `connectAdapter()` SQLite branch.
- [ ] Re-add `expo-sqlite` to the `ar new` / trailties app-generator +
      devcontainer-generator valid `--sqlite-driver` set, scaffolding
      `adapter: "expo-sqlite"`.
- [ ] An expo-sqlite (or stub async-only driver) adapter opens and round-trips a
      query in tests.
- [ ] Revisit the `openSync()` bridge in `sqlite-adapter.ts` — remove it if the
      async path fully supersedes it, or document why it stays.
