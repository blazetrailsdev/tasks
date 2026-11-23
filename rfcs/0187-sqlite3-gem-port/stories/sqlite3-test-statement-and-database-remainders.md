---
title: "sqlite3-test-statement-and-database-remainders"
status: done
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10632
claim: "2026-11-23T09:41:12Z"
assignee: "sqlite3-test-statement-and-database-remainders"
blocked-by: null
closed-reason: null
---

# sqlite3: port test_statement.rb and test_database.rb (remainders)

## Context

Split from `sqlite3-test-port-the-in-scope-gem-cases` (RFC 0187), which ported `test_integration_statement.rb` and most of `test_statement.rb` / `test_database.rb`. `pnpm parity:test --package sqlite3 --missing` still lists these in-scope cases of `vendor/sqlite3/v2.6.0/test/test_statement.rb and test_database.rb (remainders)`:

- test_statement.rb: prepare blob, select blob (need `SQLite3::Blob`), closed db behavior (gem's `sqlite3_close_v2` leaves a statement usable after `db.close`; better-sqlite3 refuses), raise if bind params not an array (Ruby arity on `execute(sql, 1, 2)`)
- test_database.rb: changes, batch last comment is processed, batch last expression value is returned (need `Database#execute_batch`, `database.rb:181-201`, and `Statement#bind_parameter_count`)

Port them under their Minitest names in `packages/sqlite3/test/test-statement.test.ts / test-database.test.ts`, line for line, against `lib/engine/better-sqlite3.js` (use `lib/engine/node-sqlite.js` only where a case needs double-quoted-string quirk mode, which better-sqlite3 is built without — see `test-database.test.ts` "strict mode").

## Acceptance criteria

- [ ] Every case above is ported; any gap that needs an engine primitive (e.g. `sqlite3_bind_parameter_count`) is added to the engine interface, not worked around in the test.
- [ ] `pnpm parity:test --package sqlite3 --missing` lists none of them, and `pnpm parity:test:assertions` stays clean.
