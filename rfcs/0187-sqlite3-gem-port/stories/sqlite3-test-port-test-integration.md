---
title: "sqlite3-test-port-test-integration"
status: draft
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
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

# sqlite3: port test_integration.rb

## Context

Split from `sqlite3-test-port-the-in-scope-gem-cases` (RFC 0187), which ported `test_integration_statement.rb` and most of `test_statement.rb` / `test_database.rb`. `pnpm parity:test --package sqlite3 --missing` still lists these in-scope cases of `vendor/sqlite3/v2.6.0/test/test_integration.rb`:

- prepare invalid syntax, prepare exception shows error position (+ newline1, newline2), prepare invalid column, prepare invalid table, prepare no block, changes, transaction rollback

Port them under their Minitest names in `packages/sqlite3/test/test-integration.test.ts`, line for line, against `lib/engine/better-sqlite3.js` (use `lib/engine/node-sqlite.js` only where a case needs double-quoted-string quirk mode, which better-sqlite3 is built without — see `test-database.test.ts` "strict mode").

## Acceptance criteria

- [ ] Every case above is ported; any gap that needs an engine primitive (e.g. `sqlite3_bind_parameter_count`) is added to the engine interface, not worked around in the test.
- [ ] `pnpm parity:test --package sqlite3 --missing` lists none of them, and `pnpm parity:test:assertions` stays clean.
