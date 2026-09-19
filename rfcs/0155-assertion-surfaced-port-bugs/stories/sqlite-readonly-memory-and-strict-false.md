---
title: "sqlite-readonly-memory-and-strict-false"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by assertions-sqlite3-adapter-remainder; four tests in
`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts` are `it.skip` with BLOCKED.

1. `readonly: true` on `:memory:` throws `TypeError: In-memory/temporary databases cannot be readonly`
   from better-sqlite3. Rails' sqlite3 gem allows it, and `sqlite3_adapter_test.rb:962-1005`
   (`test_db_is_readonly_when_readonly_option_is_true`, `test_writes_are_not_permitted_to_readonly_databases`)
   both construct `SQLite3Adapter.new(database: ":memory:", readonly: true)`.
2. `strict: false` is stored on the adapter (`sqlite3-adapter.ts:216 _strictStrings`) but never applied
   to the connection, so a non-strict connection still rejects `add_index :testings, :non_existent`.
   Rails relies on SQLite's double-quoted-string-literal misfeature being ON when not strict
   (`sqlite3_adapter_test.rb:1007-1054`).

## Acceptance criteria

The four skipped tests (`db is readonly when readonly option is true`,
`writes are not permitted to readonly databases`, `strict strings by default`,
`strict strings by default and false in database yml`) are un-skipped and pass with Rails'
assertions unchanged.
