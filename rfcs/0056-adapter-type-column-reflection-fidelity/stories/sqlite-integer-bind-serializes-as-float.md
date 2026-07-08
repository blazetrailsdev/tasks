---
title: "SQLite driver binds integer-valued JS numbers as SQLITE_FLOAT, not SQLITE_INTEGER"
status: done
updated: 2026-07-08
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 45
pr: 4763
claim: "2026-07-08T00:53:23Z"
assignee: "sqlite-integer-bind-serializes-as-float"
blocked-by: null
closed-reason: null
---

## Context

`fix(uniqueness): detect integer case-insensitive collisions on sqlite` (PR 4616) worked around a driver-level divergence rather than fixing its root
cause. The better-sqlite3 driver binds a JS integer-valued number (e.g. `1`) as
`SQLITE_FLOAT`, not `SQLITE_INTEGER`. Proven at runtime:

```sql
SELECT LOWER(?) a, typeof(?) b   -- bind [1, 1]  => a='1.0', b='real'
```

Rails' MRI sqlite3 gem binds a Ruby Integer as `SQLITE_INTEGER`, so `LOWER(1)`
yields the text `'1'`. This only surfaces where a bind flows through a
text-forcing function like `LOWER()`: normal numeric comparisons (`col = ?`)
still match because SQLite coerces `1.0`/`1` numerically. The uniqueness
case-insensitive path (`LOWER(col) = LOWER(?)`) was the first observed victim
(integer `parent_id` collision silently missed).

The workaround shipped in #4616:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` overrides
  `caseInsensitiveComparison` + `canPerformCaseInsensitiveComparisonFor` to
  restrict `LOWER()` to `column.type === "string" || "text"`, falling back to
  plain `attribute.eq(value)` for non-text columns.

This is a **deliberate structural deviation** from Rails, whose
`sqlite3_adapter.rb` never overrides `can_perform_case_insensitive_comparison_for?`
(inherits the unconditional `true` from
`abstract_adapter.rb:814-826`). Rails relies on `LOWER(int) = LOWER(?)` matching
because both sides bind as INTEGER.

## Acceptance criteria

- Investigate why the trails better-sqlite3 bind path serializes an
  integer-valued JS number as `SQLITE_FLOAT` (typeof `real`) instead of
  `SQLITE_INTEGER`. Likely in the type-cast/bind serialization for sqlite
  (`connection-adapters/sqlite3/quoting.ts` / `database-statements.ts`
  `typeCastedBinds`), or in how IntegerType hands values to the driver.
- Converge the bind so an integer value binds as `SQLITE_INTEGER`
  (`typeof(?) => 'integer'`, `LOWER(?) => '1'`), matching Rails/MRI, WITHOUT
  regressing float/decimal binds.
- Once the driver binds integers correctly, REMOVE the SQLite
  `canPerformCaseInsensitiveComparisonFor` / `caseInsensitiveComparison`
  overrides and let the base emit `LOWER(col) = LOWER(?)` unconditionally
  (Rails-faithful). Keep `uniqueness-validation.test.ts`
  `"validate case insensitive uniqueness"` green.
- Add a focused sqlite adapter test asserting `typeof(?)` binding for an integer
  value.

## Out of scope

- The uniqueness validator logic itself (done in #4616).
