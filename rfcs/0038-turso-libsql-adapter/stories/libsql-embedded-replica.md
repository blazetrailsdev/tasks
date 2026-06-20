---
title: "libsql: embedded-replica mode + sync()"
status: claimed
updated: 2026-06-20
rfc: "0038-turso-libsql-adapter"
cluster: adapter-test-fidelity
deps: ["libsql-remote-mode"]
deps-rfc: []
est-loc: 160
priority: 4
pr: null
claim: "2026-06-20T01:51:35Z"
assignee: "libsql-embedded-replica"
blocked-by: null
---

## Context

Add libSQL **embedded-replica** mode on top of remote support
(`libsql-remote-mode`). An embedded replica is a local file kept in sync with a
remote Turso primary: `new Database(localPath, { syncUrl, authToken })` plus
`db.sync()` to pull the latest. Reads are local/fast; writes go to the primary
and are reflected back on `sync()`.

`sync()` is libSQL-specific and not part of the core `SqliteConnection`
interface in `packages/activerecord/src/sqlite-adapter.ts`, so expose it
narrowly (optional method on the libsql connection / via the `raw` escape
hatch) and surface a caller-driven trigger on the adapter.

## Acceptance criteria

- [ ] Driver supports `new Database(localPath, { syncUrl, authToken })` when a
      `syncUrl` is present in config (replica mode selected over plain remote).
- [ ] A `sync()` operation is exposed on the libsql connection and reachable
      from the adapter (e.g. `LibSQLAdapter.syncReplica()`); caller-driven,
      no adapter-owned auto-sync timer in this story.
- [ ] Tests: env-gated against a real Turso primary
      (`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` + a syncUrl) — verify a replica
      reflects a remote write after `sync()`; offline test that a config with
      `syncUrl` selects replica mode.

## Notes

Depends on `libsql-remote-mode`. Periodic/auto sync is deliberately deferred
(see RFC open question 3). Do not add an empty stub for auto-sync.
