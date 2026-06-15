---
title: "MySQL quote reimplements branches inline instead of inheriting the abstract quote"
status: claimed
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: "2026-06-15T00:13:01Z"
assignee: "mysql-quote-inherit-abstract-not-reimplement"
blocked-by: null
---

## Context

Rails' MySQL adapter has **no** `def quote` override — it inherits the abstract
`quote` (mysql/quoting.rb defines only `quote_column_name` / `quote_table_name`
/ `cast_bound_value`). So a MySQL `quote` of a Date/Time dispatches through the
abstract `quote` → `self.quoted_date` / `self.quoted_time`.

Our port's `mysqlQuote` (`connection-adapters/mysql/quoting.ts`) reimplements
**every** branch inline (booleans, non-finite numbers, Temporal date/time,
binary, symbols, strings, Class), and `AbstractMysqlAdapter#quote` routes to it.
Output is currently faithful, but the structure diverges: MySQL should inherit
the abstract `quote` (now dispatch-threaded after PR #3222) rather than carry a
full re-listing. This is the MySQL analogue of `sqlite-quote-dispatch-through-super`.

## Acceptance criteria

- `mysqlQuote` is reduced to only the genuinely MySQL-specific behavior and
  otherwise delegates to the abstract `quote` via `abstractQuote.call(this, value)`,
  rather than re-listing every branch. If MySQL truly has no quote-specific
  branch (Rails has no override), the adapter should drop the override and
  inherit `AbstractAdapter#quote` directly.
- MySQL's `quoted_date` / `quoted_time` (if any divergence exists) are exposed
  on the adapter so the inherited dispatch lands on them; otherwise document
  that MySQL inherits the abstract helpers.
- Output is unchanged for every existing case — verified against current
  `mysql/quoting.test.ts`.
- No `node:*` imports, no `process.*`, async fs only, no new runtime deps.
- Test names match Rails verbatim where a Rails counterpart exists.
