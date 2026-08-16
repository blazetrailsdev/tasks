---
title: "update_all's string/array arms route through sanitize_sql_for_assignment + Arel.sql (relation.rb:604)"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6601
claim: "2026-08-16T17:45:07Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

`relation.rb:588-604` builds `values` for BOTH non-Hash arms through one call:

```ruby
values = Arel.sql(model.sanitize_sql_for_assignment(updates, table.name))
```

`updates` there is either a String (`"title = 'x'"`) or an Array
(`["title = ?", x]`) — `sanitize_sql_for_assignment` dispatches on that itself
(`activerecord/lib/active_record/sanitization.rb:60-70`: an Array/Hash goes to
`sanitize_sql_array` / `sanitize_sql_hash_for_assignment`, anything else passes
through), and it also qualifies unqualified columns against `table.name`.

`packages/activerecord/src/relation.ts` (`updateAll`) instead hand-rolls the
two arms:

- Array arm builds `new Nodes.BoundSqlLiteral(sql, normalizedBinds, {})`,
  normalizing each bind through `_qm.normalizeBoundValue` in a local loop.
- String arm builds `new Nodes.SqlLiteral(updates)` with no sanitization and
  no `table.name` qualification at all.

Neither arm calls `sanitizeSqlForAssignment`, and neither calls `Arel.sql`.
That is what the two surviving call-set baseline rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
report:

```text
activerecord  relation.ts  update_all  sanitize_sql_for_assignment
activerecord  relation.ts  update_all  sql
```

Both predate PR #6599 (which inlined `_execUpdateAll` back into `update_all`
and converged the statement-build half); they were left alone as out of scope
and are debt, not permission.

Check whether `sanitizeSqlForAssignment` already exists on the model side
(`packages/activerecord/src/sanitization.ts`) before porting — if it does,
this is a call-site convergence; if it does not, the port comes first.

## Converged shape

- Both non-Hash arms collapse to one line, per `relation.rb:604`:
  `values = Arel.sql(this.model.sanitizeSqlForAssignment(updates, table.name))`.
- The local bind-normalization loop and the hand-built `BoundSqlLiteral` /
  `SqlLiteral` go away — `sanitize_sql_array` owns bind interpolation in Rails.
- The two baseline rows above are DELETED from the shard (only-shrink, by
  hand, no reseed), and the mark is tightened with
  `pnpm parity:api:calls:tighten activerecord/relation.json`.

## Acceptance criteria

- [ ] `updateAll`'s String and Array arms route through
      `sanitizeSqlForAssignment` + `Arel.sql`, matching `relation.rb:604`.
- [ ] Unqualified columns in a string update are qualified against
      `table.name`, as Rails does — pin it with a test that fails on baseline.
- [ ] The `update_all` x `sanitize_sql_for_assignment` / `sql` rows are gone
      from `call-mismatches-exclude/activerecord/relation.json`; no new rows.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
