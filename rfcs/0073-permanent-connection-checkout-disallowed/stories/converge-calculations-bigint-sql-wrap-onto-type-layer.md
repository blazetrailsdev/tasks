---
title: "Converge calculations' SQLite bigint SQL wrap onto the type layer; pass relation.arel to select_all"
status: draft
updated: 2026-09-15
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation/calculations.ts` carries a trails-only SQLite bigint
path: `needsBigintCast`, `wrapBigintAgg`, `isBigintColumn`, and `compileManagerWithBinds`.
They wrap aggregates in `SELECT CAST(... AS TEXT)` and compile SQL by hand instead of
passing the arel manager to `select_all`.

Rails `activerecord/lib/active_record/relation/calculations.rb:469-510`
(`execute_simple_calculation`) sets `relation.select_values = [select_value]`, assigns
`query_builder = relation.arel`, then runs `model.with_connection { |c| c.select_all(query_builder, "#{model.name} #{operation.capitalize}", async: @async) }`.
`execute_grouped_calculation` (`:514+`) does the same with `relation.arel`.

Because the SQL depends on the connection, trails#7792 had to make `queryBuilder` a
per-connection closure. Rails has no such closure.

## Acceptance criteria

- Bigint precision is preserved at the type/adapter layer, e.g. through the SQLite driver's
  bigint read mode or the BigInteger type cast, not by rewriting the SQL.
- `executeSimpleCalculation` assigns `queryBuilder = relation.arel()` and passes the manager
  straight to `c.selectAll`, as Rails does at `calculations.rb:486-505`.
- `needsBigintCast`, `wrapBigintAgg` and `compileManagerWithBinds` are deleted.
- `pnpm parity:api:calls` is green.
