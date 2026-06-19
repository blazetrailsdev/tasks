---
title: "libsql: remote Turso mode (network, async-open path)"
status: claimed
updated: 2026-06-19
rfc: "0038-turso-libsql-adapter"
cluster: adapter-test-fidelity
deps: ["libsql-local-driver"]
deps-rfc: []
est-loc: 180
priority: 3
pr: null
claim: "2026-06-19T19:53:24Z"
assignee: "libsql-remote-mode"
blocked-by: null
---

## Context

Extend the libSQL driver (built in `libsql-local-driver`) to support **remote
Turso** connections over the network. Remote handles are created with
`new Database(url, { authToken })` and are network-backed, so they must use the
**async** construction path already wired for `expo-sqlite`
(`AbstractSQLite3Adapter.openAsync()` / `completeAsyncConnect()`), not the sync
`openSync()` path. See `connection-adapters/sqlite3-adapter.ts:2483-2625`
(`defaultSqliteDriver`, `openAsync`, the async-only branch) and the expo-sqlite
registration in `connection-adapters.ts:122-124`.

Config plumbing: `connection-adapters/adapter-args.ts` (`parseSqliteUrl`,
`buildAdapterArg`) already preserves sqlite-specific option keys and a `driver`
key; thread `authToken` and the remote URL through the options object.

## Acceptance criteria

- [ ] Driver detects remote URLs (`libsql://`, `http(s)://`, `ws(s)://`) and
      `driverOptions.authToken`, opening via `new Database(url, { authToken })`.
- [ ] Remote configs omit/disable `openSync()` so the async-open path handles
      connect; capabilities for remote: `inProcessSync: false`,
      `loadExtension: false`, `restoreFromPath` omitted (no remote backup) so
      callers fall back.
- [ ] `authToken` and remote URL are threaded through config
      (`parseSqliteUrl`/`buildAdapterArg`); `libsql://` URL precedence between
      `database` and `url` handled.
- [ ] Tests: network tests gated behind `TURSO_DATABASE_URL` /
      `TURSO_AUTH_TOKEN` env vars (skipped in CI by default); offline tests for
      URL parsing, remote capability selection, and async-open dispatch.

## Notes

Depends on `libsql-local-driver`. Read the expo-sqlite async-open path first.
Do not modify `AbstractSQLite3Adapter` dialect logic.
