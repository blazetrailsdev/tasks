---
title: "sqlite3 initialize: file: arm widened for libsql URLs and memory detection; rescue broader than SystemCallError"
status: draft
updated: 2026-09-11
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

trails#7710 inlined Rails' `case @config[:database].to_s` into
`SQLite3Adapter`'s constructor
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, constructor),
mirroring `activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:102-133`.
Two deviations remain in it:

1. **The `/\Afile:/` arm is widened and not empty.** Rails' `when /\Afile:/` arm
   (`sqlite3_adapter.rb:109`) has an empty body. Trails spells it
   `else if (/^file:/.test(filename) || isRemoteLibsqlUrl(filename))` and sets
   `this._memoryDatabase = isInMemoryDatabase(filename)` inside it.
   - The `isRemoteLibsqlUrl` disjunct exists only so `LibSQLRemoteAdapter`
     (`libsql-remote-adapter.ts`) can pass a `libsql://` / `https://` URL
     through without `File.expand_path` + `mkdir_p`.
   - The `isInMemoryDatabase` call marks `file::memory:` and `?mode=memory`
     URIs as memory databases. Rails leaves `@memory_database` false for every
     `file:` URI.
2. **The rescue is broader than Rails'.** Rails rescues only `SystemCallError`
   around `FileUtils.mkdir_p` (`sqlite3_adapter.rb:116-118`). Trails uses a bare
   `catch {}`, so a non-system error from `FileUtils.mkdirP` is also re-raised as
   `NoDatabaseError`.

## Converged shape

- The `file:` arm reads `else if (/^file:/.test(filename)) {}`, with an empty
  body and no memory detection, and `_memoryDatabase` is true only for
  `":memory:"`.
  - Before making this change, audit every reader of `_memoryDatabase` that
    relies on `file::memory:` detection. The Rails counterparts are
    `database_exists?` (`:135`) and the `configure_connection` /
    `reconnect` paths.
- The libsql remote pass-through leaves the Rails method. Candidates: the libsql
  adapter normalizes its config before `super`, or its driver resolves the URL
  from a non-`database` key. Neither may add a new hook on `SQLite3Adapter`.
- The rescue narrows to ruby-compat's `SystemCallError` analogue, if
  `FileUtils.mkdirP` raises one. Otherwise, re-raise anything else unchanged.

## Acceptance criteria

- [ ] The constructor's `file:` arm has no body and no extra disjunct.
- [ ] `LibSQLRemoteAdapter` still does not expand or `mkdir` a remote URL. The
      existing `sqlite-adapter.trails.test.ts` case "does not expand or mkdir a
      libsql remote URL as a local path" stays green.
- [ ] `mkdirP` failure rescues only the system-call error class.
