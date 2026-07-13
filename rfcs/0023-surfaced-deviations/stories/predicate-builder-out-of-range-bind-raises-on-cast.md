---
title: "predicate-builder-out-of-range-bind-raises-on-cast"
status: ready
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation/where.test.ts` has two faithful ports of
`where_test.rb` skipped by a DISTINCT gap from
`predicate-builder-blank-and-unboundable-contradiction` (which handled empty
hashes and un-castable strings): a query bind whose value is out of the
column's integer range.

- `where with large number` and `to sql with large number` pass a bind of
  `9223372036854775808` (2^63, one past signed-bigint max). Rails treats it as
  an un-boundable query value (`QueryAttribute#unboundable?` via the
  `ActiveModelRangeError` raised on serialize), so `where(id: [3, 2^63])` drops
  the OOR element and matches only id 3 → `[bob]`.
- These PASS on sqlite (no range enforcement) but the tests are `it.skip`
  (unconditional) because trails' MysqlBigInteger / PG integer type raises
  `ActiveModelRangeError` when the OOR bind is cast/serialized on MariaDB/PG
  instead of collapsing the predicate to a contradiction. See
  `packages/activerecord/src/relation/query-attribute.ts` `isUnboundable()` and
  the array/IN + range paths in `packages/arel/src/visitors/to-sql.ts`
  (`unboundableSign`, `HomogeneousIn#castedValues` filtering) — the OOR value
  must report `unboundable?` and be dropped, not raise, on all adapters.

The sibling story confirmed the sqlite path already produces `[bob]`; only the
PG/MariaDB raise-on-cast remains.

## Acceptance criteria

- [ ] An out-of-range integer query bind (single, array/IN, and range bound)
      collapses to the Rails contradiction (`1=0` / dropped-from-IN) on ALL
      adapters instead of raising `ActiveModelRangeError`.
- [ ] Un-skip `where with large number` and `to sql with large number` in
      `relation/where.test.ts`; they pass on sqlite, postgres, and mysql.
