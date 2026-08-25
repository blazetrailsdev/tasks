---
title: "libsql: local-file driver + adapter subclass + registration"
status: done
updated: 2026-06-19
rfc: "0038-turso-libsql-adapter"
cluster: adapter-test-fidelity
deps: []
deps-rfc: []
est-loc: 220
priority: 2
pr: 3664
claim: "2026-06-19T18:27:30Z"
assignee: "libsql-local-driver"
blocked-by: null
---

## Context

Add a libSQL **local-file** driver, the MVP of the Turso/libSQL beyond-parity
extension. The `libsql` npm package's sync API (`import Database from "libsql"`)
is better-sqlite3 API-compatible, so this driver is a near-copy of
`packages/activerecord/src/sqlite/better-sqlite3.ts` against the existing
`SqliteDriver` contract in `packages/activerecord/src/sqlite-adapter.ts`.

The SQLite adapter is split into a driver (`sqlite/*.ts`) + a thin
`AbstractSQLite3Adapter` subclass (`connection-adapters/*-adapter.ts`)
registered in `connection-adapters.ts`. Precedent:
`sqlite/node-sqlite.ts` + `connection-adapters/node-sqlite-adapter.ts`,
registered as `node-sqlite` in `connection-adapters.ts:111-120`, normalized in
`connection-adapters/adapter-args.ts:38` (`normalizeAdapterName`). Dialect,
quoting, and schema logic live entirely in `AbstractSQLite3Adapter` and are
reused unchanged.

## Acceptance criteria

- [ ] New `packages/activerecord/src/sqlite/libsql.ts` exports
      `libsqlDriver: SqliteDriver` wrapping `import Database from "libsql"`,
      with `LibsqlStatement`/`LibsqlConnection` mirroring the better-sqlite3
      driver (`run/get/all/iterate/columns/setReadBigInts(safeIntegers)`),
      reusing the `resolveDatabasePath` URI logic.
- [ ] Capabilities: `inProcessSync: true` (local), `loadExtension: false`
      (libsql disables it), `foreignKeysOnByDefault: false`; `databaseExists`
      (fs check) implemented; `restoreFromPath` implemented via libsql
      `backup()` if present, else file-clone fallback — verify against the
      installed `libsql` version.
- [ ] New `connection-adapters/libsql-adapter.ts`
      (`LibSQLAdapter extends AbstractSQLite3Adapter`, returns `libsqlDriver`
      from `defaultSqliteDriver()`).
- [ ] Registered as `"libsql"` in `connection-adapters.ts` (lazy loader,
      mirroring `nodeSqliteLoader`) and added to the sqlite branch of
      `normalizeAdapterName()` in `adapter-args.ts`.
- [ ] `packages/activerecord/package.json`: `libsql` added as an **optional**
      peer dep (mirror `peerDependenciesMeta` for better-sqlite3/expo-sqlite)
      plus an export entry for `./connection-adapters/libsql-adapter.js`.
- [ ] Tests: `sqlite/libsql.test.ts` driver-unit tests + a libsql-pointed
      smoke subset of the shared adapter behavior; local `.db` file round-trips
      inserts/selects/schema ops identically to better-sqlite3.
- [ ] Collation/virtual-table tests relying on `loadExtension` are
      capability-gated/excluded for the libsql driver.

## Notes

Read `sqlite/better-sqlite3.ts` and `sqlite-adapter.ts` first. Do not modify
`AbstractSQLite3Adapter`. Verify the installed `libsql` API surface (esp.
`backup()`, `columns()` metadata, `safeIntegers`/bigint) before finalizing.
