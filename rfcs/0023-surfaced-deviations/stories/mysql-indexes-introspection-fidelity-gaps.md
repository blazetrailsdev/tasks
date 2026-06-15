---
title: "MySQL indexes introspection: surface prefix lengths and DESC orders"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up from PR #3280 (`extract-mysql2-indexes-introspection`, RFC 0026).
That PR ported MySQL `indexes` to Rails' `SHOW KEYS FROM` implementation
(`mysql/schema_statements.rb#indexes`), which fixed the query source, the
functional-index expression unescape (`\'` → `'`), and the missing-table
`StatementInvalid` rescue. One Rails-fidelity gap remains, deferred to keep
that PR scoped and because it changes the `indexes` return shape + schema-dump
output:

**`lengths` (prefix indexes) and `orders` (DESC) not surfaced.** Rails
populates per-column `lengths` from `Sub_part` and `orders` from
`Collation == "D"` (`mysql/schema_statements.rb:43-47`), plus
`orders[expression] = :desc` for descending functional indexes. `SHOW KEYS`
already returns `Sub_part` and `Collation`, and the schema dumper's `RichIdx`
already supports optional `lengths`/`orders` (`schema-dumper.ts:73-76,
459-495, 1128-1129`) — so this is parse + thread-through, no new query.

## Acceptance criteria

- [ ] `indexes` surfaces per-column prefix `lengths` from `Sub_part`.
- [ ] `indexes` surfaces per-column `orders` (`desc` when `Collation == "D"`),
      including the expression case for descending functional indexes.
- [ ] schema dump emits `length:` / `order:` for affected indexes; verified on
      MySQL 8 + MariaDB.
