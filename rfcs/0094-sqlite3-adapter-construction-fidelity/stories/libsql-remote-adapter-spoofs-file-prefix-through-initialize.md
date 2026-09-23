---
title: "libsql-remote-adapter-spoofs-file-prefix-through-initialize"
status: in-progress
updated: 2026-09-23
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7993
claim: "2026-09-23T01:29:49Z"
assignee: "libsql-remote-adapter-spoofs-file-prefix-through-initialize"
blocked-by: null
closed-reason: null
---

## Context

`LibSQLRemoteAdapter` (`packages/activerecord/src/connection-adapters/libsql-remote-adapter.ts`) calls
`super({ ...config, database: "file:" + url })`. That sends a remote URL down Rails' empty `/\Afile:/` arm (`sqlite3_adapter.rb:109`), so it skips `File.expand_path` / `mkdir_p`. The constructor then overwrites `_connectionParameters.database` with the real URL.
As a result `_filename` holds a fake `file:libsql://…` value, which `databaseExists` (`sqlite3_adapter.rb:135`) reads.

## Acceptance criteria

- [ ] A remote URL reaches the driver without a spoofed `file:` prefix and without a post-`super` rewrite. For example, the driver reads the URL from a non-`database` key.
- [ ] No new hook is added on `SQLite3Adapter`.
- [ ] "does not expand or mkdir a libsql remote URL as a local path" stays green.
