---
title: "converge-build-where-clause-bound-sql-literal"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3693
claim: "2026-06-20T02:01:35Z"
assignee: "converge-build-where-clause-bound-sql-literal"
blocked-by: null
---

## Context

`buildBoundSqlLiteral` / `buildNamedBoundSqlLiteral` (packages/activerecord/src/relation/query-methods.ts:1670-1700) port Rails' `build_bound_sql_literal` / `build_named_bound_sql_literal` (query_methods.rb:1684-1719) and now normalize Relation/Arel bind values via `normalizeBoundValue`. But trails' `buildWhereClause` (query-methods.ts:880-910) does NOT call them — it routes `?`-positional fragments through `sanitizeSqlArray` and runs its own `:name` substitution loop, both leaning on `sanitization.ts#replaceBindVariable`. Rails' `build_where_clause` (query_methods.rb:1625-1627) instead constructs `BoundSqlLiteral` nodes for string fragments with binds. As a result the two builders are effectively dead in the `where` path (only direct unit tests in bound-sql-literal-relation.test.ts exercise them). Surfaced in PR #3628 review.

## Acceptance criteria

- [ ] `buildWhereClause` constructs `BoundSqlLiteral` via `buildBoundSqlLiteral` (positional `?`) and `buildNamedBoundSqlLiteral` (named `:name`) for string fragments with binds, matching Rails `build_where_clause`
- [ ] The bespoke named-bind substitution loop and the `sanitizeSqlArray` call in the string branch of `buildWhereClause` are removed in favor of the BoundSqlLiteral builders (or retained only where Rails genuinely differs, with a cited reason)
- [ ] Existing where / bind-parameter / sanitization tests continue to pass; api:compare and test:compare deltas non-negative
