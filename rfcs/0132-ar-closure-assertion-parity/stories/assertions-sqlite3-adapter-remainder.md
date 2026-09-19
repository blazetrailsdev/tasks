---
title: "assertions-sqlite3-adapter-remainder"
status: in-progress
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7895
claim: "2026-09-19T20:46:38Z"
assignee: "assertions-sqlite3-adapter-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-sqlite3-adapter`. PR converged 7 tests in
`adapters/sqlite3/sqlite3_adapter_test.rb` (exec insert, exec insert with quote,
primary key returns nil for no pk, exec no binds, exec query with binds/typecasts
bind vals, execute) using `QueryAttribute` binds and `result.rows`/`columns`.
Remaining mismatches are listed by
`pnpm parity:test -- --package activerecord --assertions --missing` (grep `sqlite3/`):
quoting_test, collation_test, create_folder, prevent_writes, and in sqlite3_adapter_test
the pragma group (`default pragmas`, `overriding default * pragma`, `setting new/invalid pragma`,
Rails :160-425, needs `with_memory_connection`/`with_file_connection` + `pragmas:` config,
likely production gaps: park as it.skip per RFC), `bad timeout`, database-exists/connect tests
(Rails :30-88 use SQLite3Adapter.new + assert_nothing_raised), tables/columns/index/primary key tests.

## Acceptance criteria

Each listed file reports 0 count/kind/value assertion mismatches; production bugs surfaced are
parked as it.skip with BLOCKED: and filed in 0155.
