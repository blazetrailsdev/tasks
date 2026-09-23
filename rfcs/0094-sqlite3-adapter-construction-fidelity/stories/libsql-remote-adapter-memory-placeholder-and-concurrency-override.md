---
title: "libsql-remote adapter passes a :memory: placeholder and overrides supportsConcurrentConnections"
status: draft
updated: 2026-09-23
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7993 stopped `LibSQLRemoteAdapter`
(`packages/activerecord/src/connection-adapters/libsql-remote-adapter.ts`) from
spoofing a `file:` prefix. Before `super`, it now moves the URL to a new
`remoteUrl` key and passes `database: ":memory:"`, the one value besides a
`file:` URI that skips Rails' `File.expand_path` / `mkdir_p` arm in
`initialize` (`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:102-121`).

`":memory:"` sets `@memory_database` (`sqlite3_adapter.rb:107-108`), and the
base `supports_concurrent_connections?` reads it
(`sqlite3_adapter.rb` — `!@memory_database`). That would turn off
`asyncEnabled` for a remote DB, so the adapter overrides
`supportsConcurrentConnections()` to return `true`, with a
`@noRailsEquivalent PERMANENT` tag.

So two placeholders remain:

- `database` names an in-memory DB that does not exist;
- a trails-only override exists only to undo what that placeholder implies.

`databaseExists` also answers `true` because of the placeholder
(`sqlite3_adapter.rb:135`).

## Converged shape

`database` carries a value that `initialize`'s `case` handles honestly, and no
override on `LibSQLRemoteAdapter` corrects the base adapter. Candidates:

- a remote config shape whose `database` is a real local `file:` URI or
  `:memory:` that the connection actually uses;
- routing remote transport through the driver seam, so the adapter never
  reaches `initialize` with a URL-derived value at all.

## Acceptance criteria

- [ ] `LibSQLRemoteAdapter` no longer overrides `supportsConcurrentConnections`.
- [ ] `database` passed to `SQLite3Adapter` is not a placeholder standing in for the remote URL.
- [ ] "does not expand or mkdir a libsql remote URL as a local path" stays green.
