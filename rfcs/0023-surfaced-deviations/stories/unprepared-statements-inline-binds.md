---
title: "Inline binds when preparedStatements is off (Rails non-prepared to_sql_and_binds branch)"
status: ready
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by converge-arrayhandler-homogeneous-in (PR #4440), which added the
Rails over-limit bind fallback (`database_statements.rb:36-38`) gated on
`preparedStatements` via `exceedsBindParamsLimit`
(`packages/activerecord/src/connection-adapters/abstract/database-limits.ts`).

That gate faithfully mirrors Rails' `if prepared_statements` structure, but the
**else** branch still diverges. Rails `to_sql_and_binds`
(`database_statements.rb:31-46`): when `!prepared_statements`, it compiles with
the `SubstituteBinds` collector (`abstract_adapter.rb#collector`) so **every**
value inlines and `binds == []`. trails' compile paths
(`toSqlAndBinds`, `_compileSelectSql`, `_toSqlSetOperation` in relation.ts,
`compileManagerWithBinds` in relation/calculations.ts) always call
`visitor.compileWithBinds(...)` and send real binds regardless of
`preparedStatements`. So a `preparedStatements: false` adapter/config sends
parameterized `?` + a bind array where Rails would send fully-inlined SQL with
no binds.

Functionally both execute correctly (the driver binds the `?`s), so this is a
fidelity deviation, not a correctness bug — but it means trails' emitted SQL /
statement-cache behavior differs from Rails whenever prepared statements are off.

## Acceptance criteria

- [ ] When `preparedStatements` is false, the arel->SQL compile paths inline via
      `SubstituteBinds` (→ `binds == []`), matching Rails' non-prepared
      `to_sql_and_binds` branch — not just the over-limit case.
- [ ] The existing `preparedStatements: true` behavior (bind extraction +
      over-limit inline fallback) is unchanged.
- [ ] Coverage asserting a `preparedStatements: false` connection inlines a
      multi-value `IN` (`HomogeneousIn`) with no binds.
