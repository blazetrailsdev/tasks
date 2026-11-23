---
title: "sqlite3-test-port-test-database-flags"
status: done
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10619
claim: "2026-11-23T01:25:01Z"
assignee: "sqlite3-libsql-readonly-open-flag"
blocked-by: null
closed-reason: null
---

# sqlite3: port test_database_flags.rb

## Context

Split from `sqlite3-test-port-the-in-scope-gem-cases` (RFC 0187), which ported `test_integration_statement.rb` and most of `test_statement.rb` / `test_database.rb`. `pnpm parity:test --package sqlite3 --missing` still lists these in-scope cases of `vendor/sqlite3/v2.6.0/test/test_database_flags.rb`:

- open database flags constants, conflicts with readonly / readwrite, readonly / readwrite flags, readonly / readwrite flags cant open, misuse flags, create flags, exotic flags

Port them under their Minitest names in `packages/sqlite3/test/test-database-flags.test.ts`, line for line, against `lib/engine/better-sqlite3.js` (use `lib/engine/node-sqlite.js` only where a case needs double-quoted-string quirk mode, which better-sqlite3 is built without — see `test-database.test.ts` "strict mode").

## Acceptance criteria

- [ ] Every case above is ported; any gap that needs an engine primitive (e.g. `sqlite3_bind_parameter_count`) is added to the engine interface, not worked around in the test.
- [ ] `pnpm parity:test --package sqlite3 --missing` lists none of them, and `pnpm parity:test:assertions` stays clean.
