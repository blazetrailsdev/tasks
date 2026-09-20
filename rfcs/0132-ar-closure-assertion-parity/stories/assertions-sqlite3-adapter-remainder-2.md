---
title: "assertions-sqlite3-adapter-remainder-2"
status: done
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7915
claim: "2026-09-20T21:19:49Z"
assignee: "assertions-sqlite3-adapter-remainder-2"
blocked-by: null
closed-reason: null
---

## Context

Second remainder of `assertions-sqlite3-adapter-remainder` (trails#7895), which hit the
700 LOC ceiling with 23 tests in `adapters/sqlite3/sqlite3_adapter_test.rb` still mismatched.
All sibling sqlite3 files (quoting, collation, create_folder, prevent_writes, transaction,
virtual_table, sqlite_rake) are already at 0.

Trails file: `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts`.
Rails file: `vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb`.

In scope on the implementation side:
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`. `insert logged`
asserts the exact SCHEMA queries logged during `@conn.insert`, and Rails logs
`PRAGMA table_xinfo("ex")` plus the `sqlite_master` structure query because
`primary_keys` goes through `table_structure` (`sqlite3_adapter.rb:281-284,515-519,757-766`).
`SQLite3Adapter#primaryKey` is a trails-only override with no Ruby counterpart that
emits a single `PRAGMA table_info("ex")` instead, so the assertion cannot converge
while it stands. Deleting it (Rails' sqlite3 adapter answers through the inherited
`primary_key`, `abstract/schema_statements.rb:145`) is part of this story.

Remaining rows from `pnpm parity:test -- --package activerecord --assertions --missing`:

- add column with custom primary key: equal rails 2 vs trails 3, falsy rails 1 vs trails 0
- add column with not null: equal rails 0 vs trails 1, falsy rails 1 vs trails 0, nothingRaised rails 1 vs trails 0
- add column with not null: rails 2 vs trails 1
- auto increment preserved on table changes: equal rails 0 vs trails 1, truthy rails 4 vs trails 0
- auto increment preserved on table changes: rails 4 vs trails 1
- column types: equal rails 0 vs trails 1, falsy rails 1 vs trails 0, includes rails 0 vs trails 4
- column types: rails 1 vs trails 5
- copy table with composite primary keys: equal rails 3 vs trails 1, length rails 0 vs trails 1
- copy table with composite primary keys: rails 3 vs trails 2
- copy table with existing records have custom primary key: length rails 0 vs trails 1
- copy table with existing records have custom primary key: rails 1 vs trails 2
- custom primary key in change table: equal rails 2 vs trails 1, falsy rails 1 vs trails 0, notNil rails 0 vs trails 1
- custom primary key in change table: rails 3 vs trails 2
- custom primary key in create table: equal rails 2 vs trails 1, falsy rails 1 vs trails 0
- custom primary key in create table: rails 3 vs trails 1
- database should get created when missing parent directories for database path: equal rails 0 vs trails 1, nothingRaised rails 1 vs trails 0
- default pragmas: equal rails 12 vs trails 6
- default pragmas: rails 12 vs trails 6
- exec insert default values with returning disabled: equal rails 1 vs trails 2
- exec insert default values with returning disabled: rails 1 vs trails 2
- insert id value returned: equal rails 1 vs trails 2
- insert id value returned: rails 1 vs trails 2
- insert logged: equal rails 0 vs trails 1 [unmapped: rails:assert_logged]
- overriding default journal mode pragma: equal rails 4 vs trails 2, match rails 4 vs trails 0, raises rails 4 vs trails 2
- overriding default journal mode pragma: rails 12 vs trails 4
- overriding default synchronous pragma: match rails 1 vs trails 0
- overriding default synchronous pragma: rails 5 vs trails 4
- remove column preserves index options: equal rails 2 vs trails 3, truthy rails 1 vs trails 0
- select rows: equal rails 1 vs trails 2, length rails 0 vs trails 1
- select rows logged: equal rails 0 vs trails 1 [unmapped: rails:assert_logged]
- select rows: rails 1 vs trails 3
- setting invalid pragma: match rails 2 vs trails 1
- setting invalid pragma: rails 2 vs trails 1
- setting new pragma: equal rails 14 vs trails 7
- setting new pragma: rails 14 vs trails 7
- statement closed: equal rails 1 vs trails 2, raises rails 1 vs trails 0 [unmapped: rails:assert_called]
- statement closed: rails 3 vs trails 2
- table exists logs name: equal rails 0 vs trails 1, truthy rails 1 vs trails 0 [unmapped: rails:assert_logged, trails:assertLogged]
- transaction: equal rails 2 vs trails 0, length rails 0 vs trails 1
- transaction: rails 2 vs trails 1

Notes from the first pass:

- The `logs name` / `logged` rows are `assert_logged` mapping gaps, not test bugs.
- The pragma rows need the file-database arms (`with_file_connection`); only the
  in-memory arms are ported. See also `sqlite-pragma-error-parity`.
- `statement closed` needs Rails' `assert_called` on the statement.
- The copy-table / custom-primary-key / auto-increment rows still assert over
  `PRAGMA table_info` where Rails asserts over `@conn.columns` / `primary_key`.

## Acceptance criteria

`adapters/sqlite3/sqlite3_adapter_test.rb` reports 0 count/kind/value assertion mismatches.
Production bugs surfaced are parked as it.skip with BLOCKED: and filed in 0155.
