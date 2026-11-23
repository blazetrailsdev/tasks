---
title: "mysql2 LOCAL INFILE ports infile.c over an infileStreamFactory"
status: in-progress
updated: 2026-11-23
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10640
claim: "2026-11-23T13:32:34Z"
assignee: "mysql2-local-infile-ports-infile-c"
blocked-by: null
closed-reason: null
---

## Context

`packages/mysql2/test/client.test.ts` ":local_infile" keeps "should raise an error when a non-existent file is loaded" and "should LOAD DATA LOCAL INFILE" skipped (trails#10616). The gem's `ext/mysql2/infile.c` (`mysql2_local_infile_init/read/end/error`) opens the named file and reports `No such file or directory: <path>` (spec `vendor/mysql2/0.5.6/spec/mysql2/client_spec.rb:480-496`). npm mysql2 reads a LOCAL INFILE only through `infileStreamFactory(path)` returning a stream (`mysql2/lib/commands/query.js` `_streamLocalInfile`); without it, it errors "you must provide streamFactory option".

## Converged shape

Port infile.c under its C names in `packages/mysql2/lib/` and pass an `infileStreamFactory` from `Client#connect` when `local_infile` is on. Build the stream from ruby-compat's async `File` (no `node:` imports in the package). The init/error arm raises `Mysql2::Error` with infile.c's message.

## Acceptance criteria

- [ ] Both specs run and pass against the spec's `spec/test_data` fixture (copied into `packages/mysql2/test/fixtures/`).

- [ ] `query_info` after the load reports `{records: 1, deleted: 0, skipped: 0, warnings: 0}`.
