---
title: "query-methods-order-only-call-inversions"
status: claimed
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-22T17:05:00Z"
assignee: "query-methods-order-only-call-inversions"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while migrating `activerecord/relation/query-methods.json`'s call-set
baseline rows to `@missingRailsCall` tags (RFC 0106, story `wave-5b-head-sweep`).

Four of that shard's rows are NOT language-level facts — they are ordinary port
divergences that were carried in the baseline with a reviewed reason and now
carry a `CONVERGEABLE` `@missingRailsCall` tag naming this story:

- `build_where_clause` — `order:constructor,sql`
  (`packages/activerecord/src/relation/query-methods.ts:1064`). Rails reaches
  `Arel.sql(opts)` in the String arm
  (`activerecord/lib/active_record/relation/query_methods.rb:1623`) before the
  trailing `WhereClause.new`, and handles a bare Arel node in the same trailing
  `else`; the port early-returns the node arm as `new WhereClause([opts])`
  above the String arm, inverting the order.
- `build_join_buckets` — `order:selectNamedJoins,constructor`
  (`query-methods.ts:3356`; Rails `query_methods.rb:1828-1845`).
- `build_with_join_node` — `order:table,constructor`
  (`query-methods.ts:3656`). Rails constructs `Arel::Table.new(name)` before
  touching `table` (`query_methods.rb:1955-1957`); the port hoists `this.table`
  into a local so its no-arel-table guard raises before allocating — a guard
  Rails does not have.
- `build_subquery` — `arel` (`query-methods.ts:2314`). The body builds the Arel
  manager via `_buildArel`/`toArel` rather than the memoized `arel` reader
  Rails calls at `query_methods.rb:1607`.

## Acceptance criteria

- [ ] Each site above matches Rails' evaluation order / callee, or is filed
      individually with a specific blocker.
- [ ] The corresponding `@missingRailsCall` tag is deleted, not reworded.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
