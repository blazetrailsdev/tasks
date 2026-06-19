---
title: "fix(arel): BoundSqlLiteral visitor should use addBind for parameterized SQL, not inline quoting"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T03:12:25Z"
assignee: "bound-sql-literal-addbind-visitor"
blocked-by: null
---

## Context

`visitArelNodesBoundSqlLiteral` in `packages/arel/src/visitors/to-sql.ts` (around line 1294) renders bind values by calling `visitBindValue`, which calls `this.quote(value)` and appends the result directly to the SQL string. In the `compileWithBinds` path (Composite collector), this means `BoundSqlLiteral` nodes produce inlined SQL with an empty bind list.

Rails' `visit_Arel_Nodes_BoundSqlLiteral` uses `collector.add_bind` / `collector.add_binds` for non-Arel values (`arel/visitors/to_sql.rb:774-790`), so compiled output is parameterized SQL (`topics.id = ?`) plus a bind list, not inlined SQL.

The consequence in trails: `where("topics.id = ?", 1)` produces `topics.id = 1` (inlined) with `binds = []` even though `preparable = true`. Each distinct value creates a separate cache entry; the prepared-statement template is never actually reused across invocations with different values.

This was surfaced during PR #3598 (Codex review round 8). The `statement cache with sql string literal` test passes because it keys on the emitted SQL (which is the inlined form), but the Rails behavior is parameterized.

## Acceptance criteria

- [ ] `visitArelNodesBoundSqlLiteral` routes non-Arel scalar values through `collector.addBind()` (producing `?` placeholder + bind entry) instead of `this.quote()` (inline)
- [ ] `visitBindValue` updated accordingly for the `BoundSqlLiteral` path, or a separate `visitBoundBindValue` helper introduced
- [ ] `compileWithBinds` returns `[sql_with_placeholders, [bind1, bind2, ...], retryable, preparable]` for `where("col = ?", val)`
- [ ] `statement cache with sql string literal` still passes (cache key now matches parameterized SQL)
- [ ] `statement cache with in clause` still asserts not cached (preparable=false for SqlLiteral/array paths)
- [ ] Existing finder/query-cache tests pass
