---
title: "LibSQLRemoteAdapter#databaseExists answers from File.exist? on the remote URL"
status: draft
updated: 2026-10-13
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8846 made `LibSQLRemoteAdapter`
(`packages/activerecord/src/connection-adapters/libsql-remote-adapter.ts`) its
own adapter over `AbstractAdapter`, taking the SQLite dialect by
`include(LibSQLRemoteAdapter, SQLite3Adapter)`. `database` is now the remote
URL.

`include` copies `SQLite3Adapter#databaseExists`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:218`), the
port of
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:135`:
`@config[:database] == ":memory:" || File.exist?(@config[:database].to_s)`.
For a `libsql://` URL that is `File.exist?` on a URL, so a remote adapter
answers `false` for a database that exists.

Nothing calls it on the remote path today: outside tests the only caller of the
instance method is the static `AbstractAdapter.databaseExists`
(`abstract-adapter.ts:1145-1148`), which has no source caller. It becomes a bug
the day `DatabaseTasks` or trailties asks an adapter whether its database
exists.

## Converged shape

A remote database has no local file, so the honest body is the abstract one,
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:362-367`:
`connect!; true`, `rescue ActiveRecord::NoDatabaseError; false`. Ruby's
`include` puts a module above the class and below nothing the class defines, so
the remote adapter needs its own `databaseExists` that reaches
`AbstractAdapter`'s, or the include must not carry SQLite's file-based one.

## Acceptance criteria

- [ ] `new LibSQLRemoteAdapter({ database: "libsql://…" }).databaseExists()` does not answer from `File.exist?` on the URL.
- [ ] A test drives it through a local `driver:` and asserts `true` for a reachable database.
- [ ] No placeholder `database` value is reintroduced.
