---
title: "PG DDL exec() path: translate driver errors to StatementInvalid"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `e2-pg-ddl-via-exec` (RFC 0030). PG schema-statement DDL runs via
the bare driver `exec()` (`connection-adapters/postgresql-adapter.ts:1986`),
which performs no exception translation. Only `execute()` routes through
`_translateException` -> `StatementInvalid`. So a `change_column` that PG
rejects (e.g. casting a non-array column to array, raising SQLSTATE 42804
"cannot be cast automatically") surfaces as a raw driver error, not
`StatementInvalid`.

Blocks `adapters/postgresql/array.test.ts` test
`change column cant make non array column to array`
(Rails `array_test.rb:127` `test_change_column_cant_make_non_array_column_to_array`),
which does `add_column` + `assert_raises ActiveRecord::StatementInvalid`.

Adapter-wide: any DDL on the `exec()` path that the server rejects fails to
translate. Fix belongs in the adapter (route schema-statement DDL through the
translating path, or wrap `exec`), not in the array OID code.

## Acceptance criteria

- [ ] PG schema-statement DDL the server rejects raises `StatementInvalid`.
- [ ] Un-skip `change column cant make non array column to array` in
      `array.test.ts`; it passes under PG.
- [ ] No regression to existing migration/DDL tests.
