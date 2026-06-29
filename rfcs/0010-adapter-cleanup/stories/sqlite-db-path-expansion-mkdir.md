---
title: "SQLite3Adapter: expand DB path + create parent dir (Rails initialize parity)"
status: in-progress
updated: 2026-06-29
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: 4296
claim: "2026-06-29T23:24:29Z"
assignee: "sqlite-db-path-expansion-mkdir"
blocked-by: null
---

## Context

`AbstractSQLite3Adapter`'s constructor (packages/activerecord/src/connection-adapters/sqlite3-adapter.ts, hash-only form added in PR #4064) does NOT reproduce two steps from Rails `SQLite3Adapter#initialize`
(activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:102–133):

- `@config[:database] = File.expand_path(@config[:database], Rails.root)` — for a
  non-`:memory:`, non-`file:` path, Rails expands it relative to the app root.
- `FileUtils.mkdir_p(File.dirname(...))` — Rails creates the parent directory for the DB
  file when it doesn't exist, raising `NoDatabaseError` on `SystemCallError`.

trails currently passes the raw filename straight to the driver. This is a pre-existing
deviation (the positional constructor never did it either); flagged during PR #4064 review.

## Acceptance criteria

- [ ] Non-`:memory:`/non-`file:` database paths are resolved (trails has no `Rails.root`;
      decide the equivalent base — likely cwd — and document the deviation if it differs).
- [ ] Parent directory of the DB file is created when absent, mirroring `FileUtils.mkdir_p`,
      raising `NoDatabaseError` on failure.
- [ ] Use async fs (no node:\* sync calls per repo rules) — verify this is compatible with
      the synchronous constructor path (may require deferring to the connect path).
- [ ] Test names match the corresponding Rails sqlite3_adapter_test cases.
