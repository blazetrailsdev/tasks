---
title: "InsertAll::Builder inlines quotes instead of delegating to quote_column_name"
status: ready
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
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

`ActiveRecord::InsertAll::Builder` in Rails quotes every identifier through
`quote_column(x)` → `connection.quote_column_name(x)` (vendor/rails/activerecord/
lib/active_record/insert_all.rb:323-324, used at lines 257, 259, 320). That is
dialect-aware: SQLite/PG emit `"col"` (with embedded `"` doubled via
`gsub('"','""')`, sqlite3/quoting.rb:44), MySQL emits backticks.

The trails port (packages/activerecord/src/insert-all.ts, class `Builder`)
instead **inlines hardcoded double quotes** in template strings and relies on
the MySQL adapter rewriting `"` → `` ` `` at execution time (see the class
header comment ~line 568). Concretely, none of these delegate to
`quote_column_name`:

- `into()` — `` `"${k}"` `` column list + `` `"${tableName}"` `` (insert-all.ts:636,647)
- `conflictTarget()` — `` `"${c}"` `` (insert-all.ts:692,698)
- `updatableColumns()` — `` `"${c}"` `` (insert-all.ts:705)
- `touchModelTimestampsUnless()` — `` `"${col}"` `` (insert-all.ts:723)
- `quotedTableName()` — `` `"${name}"` `` (insert-all.ts:734)
- `firstColumn()` — `` `"${first}"` `` (insert-all.ts:758)
- `returning()` — `` `"${physical}" AS "${attr}"` `` (insert-all.ts:618-622)

There is also an **internal inconsistency**: only `returning()` does the
SQLite-style embedded-quote doubling (`.replace(/"/g, '""')`); every sibling
omits it. So `returning()` is closer to `quote_column_name` than the others but
diverges from the file's own convention. This was surfaced reviewing PR #3513
(insert-all-returning-alias-resolution); column names in the canonical schema
never contain `"`, so it is currently behaviorally inert.

## Acceptance criteria

- [ ] `Builder` identifier quoting delegates to `connection.quoteColumnName` /
      `quoteTableName` (the trails equivalent of `quote_column_name` /
      `quote_table_name`), matching insert_all.rb's `quote_column` indirection,
      rather than inlining `"${...}"`.
- [ ] Embedded-quote doubling behaviour comes from the adapter (not ad-hoc
      `.replace` in one method); `returning()` no longer special-cases it.
- [ ] MySQL still emits backticks; confirm whether the existing
      "double-quote then mysqlQuote() at exec time" path is still needed or can
      be dropped once quoting is adapter-delegated. Document the decision.
- [ ] insert_all/upsert_all tests stay green on SQLite, PG, and MySQL;
      api:compare and test:compare deltas non-negative.

## Notes

Related quoting-deviation stories under this RFC:
abstract-quoting-helpers-broader-than-rails, sqlite-quote-dispatch-through-super,
mysql-quote-inherit-abstract-not-reimplement,
quote-dispatch-through-column-name-and-quoted-date.
