---
title: "assertions-tail-adapters-2-remainder"
status: claimed
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-09-20T17:52:09Z"
assignee: "assertions-tail-adapters-2-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of assertions-tail-adapters-2 (trails PR for the converged subset:
`adapters/sqlite3/copy_table_test.rb`, `adapters/sqlite3/virtual_column_test.rb`
and 5 of 7 rows in `connection_handlers_sharding_db_test.rb` are at 0).

Conversions that worked: `expect(raised).toBeUndefined()` -> `await expect(p).resolves.not.toThrow()`
(assert_nothing_raised); `toBe(true/false)` on predicates -> `toBeTruthy()/toBeFalsy()`;
assert_raises + message checks -> capture the error in `.catch`, rethrow, `.rejects.toThrow(Class)`, then `toEqual` on message.

Still mismatching (re-measure with `pnpm parity:test -- --package activerecord --assertions --missing`):

- `connection_adapters/connection_handlers_sharding_db_test.rb`: "establishing a connection in connected to block uses current role and shard", "switching connections via handler" (equal 4 vs 24, falsy 14 vs 0, truthy 6 vs 0)
- `adapters/abstract_mysql_adapter/`: table_options_test, bind_parameter_test, adapter_prevent_writes_test, active_schema_test, warnings_test
- `adapters/postgresql/`: connection_test, datatype_test, money_test, timestamp_test, invertible_migration_test, hstore_test, explain_test, date_test, rename_table_test, schema_authorization_test

MySQL/PG rows could not be run locally (no server), so they need CI or a local DB.

## Acceptance criteria

- Each listed file reports 0 count/kind/value mismatches; no test renames; do not touch the frozen mark file.
- A converged assertion that fails is parked `it.skip` with `BLOCKED:` and a story in 0155.
