---
title: "SQLite3 encoding getter returns the UTF-8 fallback on async-only drivers"
status: draft
updated: 2026-09-10
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

Rails' `SQLite3Adapter#encoding`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:237-239`)
is `any_raw_connection.encoding.to_s`: it asks a live raw connection, opening one
if needed, and returns the database's real encoding.

trails' getter (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:677-679`)
is `SQLite3Adapter.parseEncoding(this._rawConnection?.pragma("encoding"))`. On an
async-only driver `pragma()` returns a Promise, so `parseEncoding` indexes into
the Promise, finds nothing, and silently returns its `"UTF-8"` fallback, whatever
the database's encoding really is.

This regresses the done story `async-only-sqlite-sync-getters` (RFC 0010). Its fix
cached the encoding at connect time (`_encoding`, read by the getter). PR #7662
converged `connect` / `connectAsync` onto Rails' body (`sqlite3_adapter.rb:806-810`,
assign the client and nothing else) and removed that cache along with the extra
pragma read, which left the getter's async arm with nothing to read.

## Converged shape

The reader mirrors `any_raw_connection.encoding.to_s`: it goes through
`anyRawConnection` and reads the encoding from the raw connection. For async
drivers that means an awaitable reader, rather than a value cached as a side
effect of `connect`, which Rails' `connect` does not do.

## Acceptance criteria

- [ ] `encoding` returns the database's actual encoding on every driver,
      including async-only ones (libsql, expo-sqlite), rather than the `"UTF-8"`
      fallback.
- [ ] It reads through `anyRawConnection` as `sqlite3_adapter.rb:238` does, and
      `connect` does not grow back an encoding read.
- [ ] A regression test on an async-only driver with a non-UTF-8 database fails
      on the pre-change baseline.
