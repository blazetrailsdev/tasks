---
title: "libsql-remote: a remote database URL is expanded and mkdir'd as a local path"
status: in-progress
updated: 2026-09-11
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7686
claim: "2026-09-11T02:29:34Z"
assignee: "libsql-remote-url-expanded-as-local-path"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7668, which deleted `buildAdapterArg`: `DatabaseConfig#newConnection`
now passes `configuration_hash` straight to the adapter constructor
(`activerecord/lib/active_record/database_configurations/database_config.rb:25-27`).

`buildAdapterArg` used to copy a libsql-remote `url:` (`libsql://`, `https://`, `wss://`…)
into `database`. That copy is gone, so a remote config must now carry the URL in
`database:` itself. The `SQLite3Adapter` constructor
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, the
`prepareDatabasePath` call) then treats any `database` that is neither `:memory:` nor
`file:` as a local path, mirroring `sqlite3_adapter.rb:104-121`: it runs
`File.expandPath`, then `FileUtils.mkdirP`s the dirname. For `libsql://mydb.turso.io`
that produces `<cwd>/libsql:/mydb.turso.io` and creates a `libsql:` directory. So
the remote driver receives a mangled path instead of the URL.

This path mangling predated #7668. `buildAdapterArg` also handed the URL over as
`database`, so the constructor mangled it then too. #7668 just made
`database:` the only route for a remote URL. A `url:`-only remote config now
raises Rails' `No database file specified` `ArgumentError`
(`sqlite3_adapter.rb:104-106`). Also, `UrlConfig`/`ConnectionUrlResolver` resolve a
`libsql://` URL into `adapter: "libsql"` + `host`, not into a remote database.

## Acceptance criteria

- [ ] A LibSQLRemoteAdapter configured with a remote URL opens that URL, and the URL
      is never expanded as a filesystem path or mkdir'd.
- [ ] The SQLite3Adapter constructor body stays line-for-line with
      `sqlite3_adapter.rb:102-133`; the remote handling lives in the trails-only
      libsql-remote adapter/driver files, not as a new branch in the ported body.
- [ ] Regression test: constructing a remote adapter with `database: "libsql://x"`
      creates no directory.
